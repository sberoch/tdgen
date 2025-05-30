import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';

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
export class ExportDialogComponent implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter<void>();

  exportForm: FormGroup;
  private formSubscription: Subscription = new Subscription();
  private readonly storageKey = 'export-dialog-form-data';

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
      einstellung: [false, Validators.required],
      versetzung: [false, Validators.required],
      umsetzung: [false, Validators.required],
      aufgabenaderung: [false, Validators.required],
      sonstigesCheckbox: [false, Validators.required],
      sonstigesInput: ['', Validators.required],
      effectiveDate: ['', Validators.required],
      beschaftigungsdienststelle: ['', Validators.required],
      organisationseinheit: ['', Validators.required],
      dienstpostennr: ['', Validators.required],
      funktion: ['', Validators.required],
      employeeName: ['', Validators.required],
      workplaceStartDate: ['', Validators.required],
      disabled: ['', Validators.required],
      employmentScope: ['', Validators.required],
      parttimeHours: ['', Validators.required],
      periodStart: ['', Validators.required],
      periodEnd: ['', Validators.required],
      periodType: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadFormData();
    this.subscribeToFormChanges();
  }

  ngOnDestroy() {
    this.formSubscription.unsubscribe();
  }

  private subscribeToFormChanges() {
    this.formSubscription = this.exportForm.valueChanges.subscribe(
      (formData) => {
        this.saveFormData(formData);
      }
    );
  }

  private saveFormData(formData: any) {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(formData));
    } catch (error) {
      console.warn('Failed to save form data to session storage:', error);
    }
  }

  private loadFormData() {
    try {
      const savedData = sessionStorage.getItem(this.storageKey);
      if (savedData) {
        const formData = JSON.parse(savedData);
        this.exportForm.patchValue(formData);
      }
    } catch (error) {
      console.warn('Failed to load form data from session storage:', error);
    }
  }

  private clearFormData() {
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear form data from session storage:', error);
    }
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
      // Clear saved data after successful export
      this.clearFormData();
    } else {
      // Mark all fields as touched to show validation errors
      this.exportForm.markAllAsTouched();
      console.log('Form is invalid');
    }
  }

  resetForm() {
    this.exportForm.reset();
    this.clearFormData();
    // Reset date input types to text
    Object.keys(this.dateInputTypes).forEach((key) => {
      this.dateInputTypes[key] = 'text';
    });
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
