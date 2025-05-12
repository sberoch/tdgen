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

  private readonly titleRegex = /^[A-Za-z0-9\-\s().,]{1,100}$/;
  private readonly invalidInputMessage =
    'Ungültige Eingabe: Erlaubt sind maximal 100 Zeichen, bestehend aus Groß- und Kleinbuchstaben, Zahlen, Leerzeichen, Bindestrich (-), Punkt (.), Komma (,) sowie runden Klammern ().';

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
    const trimmedTitle = this.title.trim();

    if (!trimmedTitle) {
      this.errorMessage = 'Der Titel darf nicht leer sein.';
      return;
    }

    if (!this.titleRegex.test(trimmedTitle)) {
      this.errorMessage = this.invalidInputMessage;
      return;
    }

    if (this.isEditing && trimmedTitle === this.data.title) {
      this.dialogRef.close(trimmedTitle);
      return;
    }

    if (trimmedTitle) {
      this.jobDescriptionsService
        .existsByTitle(trimmedTitle)
        .subscribe((exists) => {
          if (!exists) {
            if (!this.isEditing) {
              this.jobDescriptionsService
                .createJobDescription({
                  title: trimmedTitle,
                  metadata: {},
                  tags: [],
                  formFields: {},
                })
                .subscribe((jobDescription) => {
                  this.dialogRef.close(jobDescription);
                });
            } else {
              this.jobDescriptionsService
                .updateJobDescription(this.data.id!, {
                  title: trimmedTitle,
                })
                .subscribe((jobDescription) => {
                  this.dialogRef.close(jobDescription);
                });
            }
          } else {
            this.errorMessage =
              'Dieser Titel existiert bereits. Bitte wählen sie einen anderen Titel.';
          }
        });
    }
  }
}
