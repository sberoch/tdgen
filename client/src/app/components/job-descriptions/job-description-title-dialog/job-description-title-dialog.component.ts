import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { JobDescriptionsService } from '../../../services/job-descriptions.service';
import { CreateJobDescription } from '../../../types/job-descriptions';

export interface JobDescriptionTitleDialogData {
  title?: string;
  id?: number;
  isEditing?: boolean;
}

@Component({
  selector: 'app-job-description-title-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './job-description-title-dialog.component.html',
  styleUrls: ['./job-description-title-dialog.component.css'],
})
export class JobDescriptionTitleDialogComponent {
  title: string = '';
  errorMessage: string = '';
  isEditing: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<JobDescriptionTitleDialogComponent>,
    private jobDescriptionsService: JobDescriptionsService,
    @Inject(MAT_DIALOG_DATA) public data: JobDescriptionTitleDialogData
  ) {
    if (data) {
      this.title = data.title || '';
      this.isEditing = data.isEditing || false;
    }
  }

  onAccept() {
    this.errorMessage = '';
    if (this.isEditing && this.title.trim() === this.data.title) {
      this.dialogRef.close(this.title.trim());
      return;
    }

    if (this.title.trim()) {
      this.jobDescriptionsService
        .existsByTitle(this.title.trim())
        .subscribe((exists) => {
          if (!exists) {
            const jobData: CreateJobDescription = {
              title: this.title.trim(),
              metadata: {},
              tags: [],
              formFields: {},
            };

            if (!this.isEditing) {
              this.jobDescriptionsService
                .createJobDescription(jobData)
                .subscribe((jobDescription) => {
                  this.dialogRef.close(jobDescription);
                });
            } else {
              this.jobDescriptionsService
                .updateJobDescription(this.data.id!, jobData)
                .subscribe((jobDescription) => {
                  this.dialogRef.close(jobDescription);
                });
            }
          } else {
            this.errorMessage =
              'Dieser Titel existiert bereits. Bitte wählen sie einen anderen Titel.';
          }
        });
    } else {
      this.errorMessage = 'Der Titel darf nicht leer sein.';
    }
  }
}
