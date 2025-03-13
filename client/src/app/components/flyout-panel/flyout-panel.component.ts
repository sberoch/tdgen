import {
  Component,
  EventEmitter,
  Input,
  Output,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-flyout-panel',
  templateUrl: './flyout-panel.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
})
export class FlyoutPanelComponent {
  @Input() isOpen = false;
  @Input() title = 'Panel Title';
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onKeydownEscape() {
    if (this.isOpen) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
