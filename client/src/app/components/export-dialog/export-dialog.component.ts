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
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { JobDescriptionsService } from '../../services/job-descriptions.service';
import { CurrentWorkspaceService } from '../../services/current-workspace.service';
import { ExportJobDescriptionForm } from '../../types/job-descriptions';
import { fillJobDescriptionForm } from './fill-job-description-form';

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

  exportForm: FormGroup<ExportJobDescriptionForm>;
  private formSubscription: Subscription = new Subscription();
  private readonly storageKey = 'export-dialog-form-data';
  showValidationErrors = false;

  // Track which date inputs are focused to switch between text and date types
  dateInputTypes: { [key: string]: string } = {
    date: 'text',
    effectiveDate: 'text',
    workplaceStartDate: 'text',
    periodStart: 'text',
    periodEnd: 'text',
  };

  constructor(
    private fb: FormBuilder,
    private jobDescriptionsService: JobDescriptionsService,
    private currentWorkspaceService: CurrentWorkspaceService
  ) {
    this.exportForm = this.fb.group(
      {
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
      },
      { validators: this.dateRangeValidator }
    );
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
        // Hide validation errors if form becomes valid
        if (this.exportForm.valid && this.showValidationErrors) {
          this.showValidationErrors = false;
        }
      }
    );
  }
  private saveFormData(formData: any) {
    try {
      const formattedData = { ...formData };

      // Remove the employeeName field from storage
      delete formattedData.employeeName;

      const dateFields = [
        'date',
        'effectiveDate',
        'workplaceStartDate',
        'periodStart',
        'periodEnd',
      ];

      dateFields.forEach((fieldName) => {
        if (
          formattedData[fieldName] &&
          formattedData[fieldName].includes('-')
        ) {
          const [year, month, day] = formattedData[fieldName].split('-');
          formattedData[fieldName] = `${day}.${month}.${year}`;
        }
      });
      sessionStorage.setItem(this.storageKey, JSON.stringify(formattedData));
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

  close() {
    this.closeModal.emit();
  }

  export() {
    const currentJobDescription =
      this.currentWorkspaceService.getCurrentJobDescriptionValue();
    if (!currentJobDescription) {
      console.error('No job description selected');
      return;
    }

    // Validate form before export
    // if (this.exportForm.invalid) {
    //   this.showValidationErrors = true;
    //   this.exportForm.markAllAsTouched();
    //   return;
    // }

    const currentJobDescriptionId = currentJobDescription.id;
    this.jobDescriptionsService
      .downloadJobDescriptionPdf(currentJobDescriptionId)
      .subscribe({
        next: async (blob) => {
          const arrayBuffer = await blob.arrayBuffer();
          const newArrayBuffer = await fillJobDescriptionForm(
            this.exportForm,
            currentJobDescription,
            arrayBuffer
          );
          // Create a blob URL and trigger download
          const url = window.URL.createObjectURL(new Blob([newArrayBuffer]));
          const link = document.createElement('a');
          link.href = url;

          // Get form data for employee name
          const formData = this.exportForm.value;
          const employeeName = formData.employeeName?.trim() || 'Unknown';

          // Get job description title
          const jobDescriptionTitle =
            currentJobDescription?.title || 'Job Description';

          // Get current date
          const now = new Date();
          const currentDate = `${now.getFullYear()}${(now.getMonth() + 1)
            .toString()
            .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;

          // Format filename: employeeName - titleOfJobDescription (Current date)
          link.download = `${employeeName} - ${jobDescriptionTitle} (${currentDate}).pdf`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading PDF:', error);
        },
      });
  }

  resetForm() {
    this.exportForm.reset();
    this.clearFormData();
    this.showValidationErrors = false;
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

  // Custom date range validator
  dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
    const periodStart = group.get('periodStart')?.value;
    const periodEnd = group.get('periodEnd')?.value;

    if (periodStart && periodEnd) {
      // Convert date strings to Date objects for comparison
      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);

      if (endDate < startDate) {
        return { dateRangeInvalid: true };
      }
    }
    return null;
  };

  // Check if date range validation error exists
  hasDateRangeError(): boolean {
    return !!(
      this.exportForm.hasError('dateRangeInvalid') &&
      this.exportForm.get('periodStart')?.value &&
      this.exportForm.get('periodEnd')?.value
    );
  }
}
