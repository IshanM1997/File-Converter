import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConversionOptions {
  source_exts: string[];
  targets: string[];
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ConverterService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  getConversionOptions(files: File[]): Observable<ConversionOptions> {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    return this.http.post<ConversionOptions>(`${this.base}/conversion-options`, fd);
  }

  convert(files: File[], target: string): Observable<Blob> {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    fd.append('target', target);
    return this.http.post(`${this.base}/convert`, fd, { responseType: 'blob' });
  }

  merge(files: File[]): Observable<Blob> {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    return this.http.post(`${this.base}/merge`, fd, { responseType: 'blob' });
  }
}
