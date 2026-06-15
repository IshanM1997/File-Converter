import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-format-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="fmt-badge" [class.fmt-large]="large" [ngClass]="colorClass">
      {{ ext.toUpperCase() }}
    </span>
  `,
  styles: [`
    .fmt-badge {
      display: inline-block;
      padding: 2px 8px; border-radius: 6px;
      font-size: 0.68rem; font-weight: 700;
      letter-spacing: .06em; text-transform: uppercase;
    }
    .fmt-large {
      font-size: 0.82rem; padding: 5px 12px; border-radius: 8px;
    }
    .fmt-pdf  { background: rgba(239,68,68,.15);  color: #ef4444; }
    .fmt-csv  { background: rgba(34,197,94,.15);  color: #22c55e; }
    .fmt-xlsx { background: rgba(34,197,94,.15);  color: #22c55e; }
    .fmt-doc  { background: rgba(59,130,246,.15); color: #60a5fa; }
    .fmt-txt  { background: rgba(245,158,11,.15); color: #f59e0b; }
    .fmt-png  { background: rgba(0,199,177,.15);  color: #00C7B1; }
    .fmt-jpg  { background: rgba(0,199,177,.15);  color: #00C7B1; }
    .fmt-jpeg { background: rgba(0,199,177,.15);  color: #00C7B1; }
    .fmt-default { background: rgba(120,128,170,.15); color: #7880AA; }
  `]
})
export class FormatBadgeComponent {
  @Input() ext = '';
  @Input() large = false;

  get colorClass() {
    const known = ['pdf','csv','xlsx','doc','txt','png','jpg','jpeg'];
    return known.includes(this.ext) ? `fmt-${this.ext}` : 'fmt-default';
  }
}
