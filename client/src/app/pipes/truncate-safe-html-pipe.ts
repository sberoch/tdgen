import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { getSmartTruncatedHtmlPreview } from '../utils/card.utils';

@Pipe({ name: 'truncateSafeHtml', pure: true })
export class TruncateSafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(html: string, maxLength: number): SafeHtml {
    if (!html || !maxLength) return '';
    const truncated = getSmartTruncatedHtmlPreview(html, maxLength);
    return this.sanitizer.bypassSecurityTrustHtml(truncated);
  }
}
