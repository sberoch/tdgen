import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-export-modal',
  imports: [CommonModule],
  templateUrl: './export-modal.component.html',
  styleUrl: './export-modal.component.css',
})
export class ExportModalComponent {
  @Input() isOpen: boolean = false;
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  closeModal(): void {
    this.close.emit();
  }
}
