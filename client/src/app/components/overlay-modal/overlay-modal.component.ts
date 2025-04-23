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
  @Output() contentClose: EventEmitter<void> = new EventEmitter<void>();

  closeModal(): void {
    // First emit contentClose to allow child components to perform cleanup
    this.contentClose.emit();
    // Then emit close to allow parent components to handle the modal closing
    this.close.emit();
  }
}
