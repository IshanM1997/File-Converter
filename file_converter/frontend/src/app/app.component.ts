import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ConverterService } from './converter.service';
import { FormatBadgeComponent } from './format-badge.component';

declare var bootstrap: any;

export type ModalState = 'idle' | 'convert-options' | 'converting' | 'merging' | 'success' | 'error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormatBadgeComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // ── Upload state ──────────────────────────────────────────────────────────
  files: File[] = [];
  isDragging = false;

  readonly ALLOWED_EXTS = ['pdf','csv','xlsx','doc','txt','png','jpeg','jpg'];

  // ── Modal state ───────────────────────────────────────────────────────────
  modalState: ModalState = 'idle';
  modalTitle = '';
  modalMessage = '';
  convertTargets: string[] = [];
  selectedTarget: string | null = null;
  isProcessing = false;

  @ViewChild('mainModal') mainModalRef!: ElementRef;
  private modalInstance: any;

  readonly steps = [
    { num: 'Step 01', icon: 'bi-cloud-upload-fill', title: 'Upload Your Files', desc: 'Drag & drop or browse. Supports PDF, CSV, XLSX, DOC, TXT, PNG, JPEG, JPG.' },
    { num: 'Step 02', icon: 'bi-arrow-repeat',       title: 'Convert or Merge',  desc: 'Pick a target format to convert, or merge files of the same type into one.' },
    { num: 'Step 03', icon: 'bi-download',           title: 'Download Result',   desc: 'Your converted or merged file downloads instantly. Multiple files come as a ZIP.' },
  ];

  constructor(private svc: ConverterService) {}

  // ── Computed helpers ──────────────────────────────────────────────────────
  get uniqueExts(): string[] {
    return [...new Set(this.files.map(f => this.getExt(f)))];
  }

  get canMerge(): boolean {
    return this.files.length >= 2;
  }

  get canAct(): boolean {
    return this.files.length > 0;
  }

  getExt(f: File): string {
    return f.name.split('.').pop()?.toLowerCase() ?? '';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getFileIcon(f: File): string {
    const e = this.getExt(f);
    const icons: Record<string, string> = {
      pdf: 'bi-file-earmark-pdf-fill text-danger',
      csv: 'bi-file-earmark-spreadsheet-fill text-success',
      xlsx: 'bi-file-earmark-excel-fill text-success',
      doc: 'bi-file-earmark-word-fill text-primary',
      txt: 'bi-file-earmark-text-fill text-warning',
      png: 'bi-file-earmark-image-fill text-info',
      jpg: 'bi-file-earmark-image-fill text-info',
      jpeg: 'bi-file-earmark-image-fill text-info',
    };
    return icons[e] ?? 'bi-file-earmark-fill text-secondary';
  }

  // ── Upload handlers ───────────────────────────────────────────────────────
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(e: DragEvent) {
    e.preventDefault(); this.isDragging = true;
  }

  onDragLeave() { this.isDragging = false; }

  onDrop(e: DragEvent) {
    e.preventDefault(); this.isDragging = false;
    if (e.dataTransfer?.files)
      this.addFiles(Array.from(e.dataTransfer.files));
  }

  addFiles(incoming: File[]) {
    const valid = incoming.filter(f => this.ALLOWED_EXTS.includes(this.getExt(f)));
    const invalid = incoming.filter(f => !this.ALLOWED_EXTS.includes(this.getExt(f)));

    const newFiles = valid.filter(
      nf => !this.files.some(ex => ex.name === nf.name && ex.size === nf.size)
    );
    this.files = [...this.files, ...newFiles];

    if (invalid.length) {
      this.showError(
        'Unsupported File Type',
        `The following files were skipped because their format is not supported:\n${invalid.map(f => f.name).join(', ')}\n\nSupported: ${this.ALLOWED_EXTS.join(', ')}`
      );
    }
  }

  removeFile(i: number) {
    this.files = this.files.filter((_, idx) => idx !== i);
  }

  clearAll() { this.files = []; }

  // ── Actions ───────────────────────────────────────────────────────────────
  onConvertTo() {
    if (!this.canAct) return;
    this.isProcessing = true;
    this.svc.getConversionOptions(this.files).subscribe({
      next: (res) => {
        this.isProcessing = false;
        if (res.error) { this.showError('Cannot Convert', res.error); return; }
        if (!res.targets.length) {
          this.showError('No Conversion Available',
            `No common target formats found for: ${this.uniqueExts.join(', ')}`);
          return;
        }
        this.convertTargets = res.targets;
        this.selectedTarget = null;
        this.modalState = 'convert-options';
        this.modalTitle = 'Convert To…';
        this.openModal();
      },
      error: (err) => {
        this.isProcessing = false;
        this.showError('Error', err?.error?.error ?? 'Failed to get conversion options.');
      }
    });
  }

  onMergeFiles() {
    if (!this.canMerge) return;

    if (this.uniqueExts.length > 1) {
      this.showError(
        'Cannot Merge — Different File Types',
        `All files must share the same extension to merge.\n\nFound: ${this.uniqueExts.map(e => '.' + e).join(', ')}\n\nPlease upload files with the same format.`
      );
      return;
    }

    this.modalState = 'merging';
    this.modalTitle = 'Merge Files';
    this.modalMessage = `Merging ${this.files.length} ${this.uniqueExts[0].toUpperCase()} files…`;
    this.openModal();
    this.doMerge();
  }

  selectTarget(t: string) { this.selectedTarget = t; }

  confirmConvert() {
    if (!this.selectedTarget) return;
    const target = this.selectedTarget;

    // same-ext guard (belt-and-suspenders; API also checks)
    if (this.uniqueExts.length === 1 && this.uniqueExts[0] === target) {
      this.showError('Same Format', `Files are already .${target}. Choose a different target format.`);
      return;
    }

    this.modalState = 'converting';
    this.modalTitle = 'Converting…';
    this.modalMessage = `Converting ${this.files.length} file(s) to .${target}…`;

    this.svc.convert(this.files, target).subscribe({
      next: (blob) => this.handleDownload(blob, target),
      error: (err) => {
        err.error.text().then((t: string) => {
          try { const j = JSON.parse(t); this.showError('Conversion Failed', j.error); }
          catch { this.showError('Conversion Failed', t || 'Unknown error.'); }
        }).catch(() => this.showError('Conversion Failed', 'Unknown error.'));
      }
    });
  }

  doMerge() {
    this.svc.merge(this.files).subscribe({
      next: (blob) => this.handleDownload(blob, this.uniqueExts[0]),
      error: (err) => {
        err.error.text().then((t: string) => {
          try { const j = JSON.parse(t); this.showError('Merge Failed', j.error); }
          catch { this.showError('Merge Failed', t || 'Unknown error.'); }
        }).catch(() => this.showError('Merge Failed', 'Unknown error.'));
      }
    });
  }

  handleDownload(blob: Blob, ext: string) {
    const isZip  = blob.type === 'application/zip';
    const name   = isZip ? 'converted_files.zip' : `result.${ext}`;
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);

    this.modalState = 'success';
    this.modalTitle = 'Done!';
    this.modalMessage = `Your file${isZip ? 's have' : ' has'} been downloaded as "${name}".`;
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────
  openModal() {
    const el = this.mainModalRef?.nativeElement;
    if (!el) return;
    this.modalInstance = this.modalInstance ?? new bootstrap.Modal(el);
    this.modalInstance.show();
  }

  closeModal() {
    this.modalInstance?.hide();
    this.modalState = 'idle';
    this.selectedTarget = null;
  }

  showError(title: string, msg: string) {
    this.modalState = 'error';
    this.modalTitle = title;
    this.modalMessage = msg;
    this.openModal();
  }
}
