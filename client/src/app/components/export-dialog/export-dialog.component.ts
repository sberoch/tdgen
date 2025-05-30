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

  // Track which date inputs are focused to switch between text and date types
  dateInputTypes: { [key: string]: string } = {
    date: 'text',
    effectiveDate: 'text',
    workplaceStartDate: 'text',
    periodStart: 'text',
    periodEnd: 'text',
  };

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

  // Get the input type for date fields (text to show placeholder, date when focused)
  getInputType(fieldName: string): string {
    return this.dateInputTypes[fieldName] || 'text';
  }

  // Handle focus on date inputs - switch to date type to show date picker
  onDateFocus(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fieldName = input.name;
    if (fieldName && this.dateInputTypes.hasOwnProperty(fieldName)) {
      this.dateInputTypes[fieldName] = 'date';
    }
  }

  // Handle blur on date inputs - switch back to text if empty to show placeholder
  onDateBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fieldName = input.name;
    if (fieldName && this.dateInputTypes.hasOwnProperty(fieldName)) {
      // If the field is empty, switch back to text to show placeholder
      if (!input.value) {
        this.dateInputTypes[fieldName] = 'text';
      }
    }
  }
}
