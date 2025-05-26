import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-export-dialog',
  templateUrl: './export-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class ExportDialogComponent {
  @Output() closeModal = new EventEmitter<void>();

  exportForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.exportForm = this.fb.group({
      department: ['', Validators.required],
      location: ['', Validators.required],
      date: ['', Validators.required],
    });
  }

  private transformFormData(formData: any) {
    return {
      'f.dienst.1': formData.department,
      'f.ort.1': formData.location,
      'f.datum.1': formData.date,
    };
  }

  close() {
    this.closeModal.emit();
  }

  export() {
    if (this.exportForm.valid) {
      console.log('export', this.transformFormData(this.exportForm.value));
    } else {
      // Mark all fields as touched to show validation errors
      this.exportForm.markAllAsTouched();
      console.log('Form is invalid');
    }
  }

  // Helper method to check if a field has errors and has been touched
  hasFieldError(fieldName: string): boolean {
    const field = this.exportForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Helper method to get error message for a field
  getFieldErrorMessage(fieldName: string): string {
    const field = this.exportForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'Dieses Feld ist erforderlich';
      }
    }
    return '';
  }
}
