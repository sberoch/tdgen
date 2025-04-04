import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-overlay-modal',
  imports: [CommonModule],
  templateUrl: './overlay-modal.component.html',
  styleUrl: './overlay-modal.component.css',
})
export class OverlayModalComponent {
  @Input() isOpen: boolean = false;
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  closeModal(): void {
    this.close.emit();
  }
}
