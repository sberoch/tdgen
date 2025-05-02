import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateJobDescription,
  JobDescription,
} from '../../../types/job-descriptions';

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
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: JobDescriptionTitleDialogData
  ) {
    if (data) {
      this.title = data.title || '';
      this.isEditing = data.isEditing || false;
    }
  }

  async onAccept() {
    this.errorMessage = '';
    if (this.isEditing && this.title.trim() === this.data.title) {
      this.dialogRef.close(this.title.trim());
      return;
    }

    if (this.title.trim()) {
      const exists = await firstValueFrom(
        this.http.get<boolean>(
          `${
            environment.apiUrl
          }api/job-descriptions/exists?title=${this.title.trim()}`
        )
      );

      const data: CreateJobDescription = {
        title: this.title.trim(),
        metadata: {},
        tags: [],
        formFields: {},
      };

      if (!exists) {
        if (!this.isEditing) {
          const jobDescription = await firstValueFrom(
            this.http.post<CreateJobDescription>(
              `${environment.apiUrl}api/job-descriptions`,
              data
            )
          );
          this.dialogRef.close(jobDescription);
        } else {
          const jobDescription = await firstValueFrom(
            this.http.patch<JobDescription>(
              `${environment.apiUrl}api/job-descriptions/${this.data.id}`,
              data
            )
          );
          this.dialogRef.close(jobDescription);
        }
      } else {
        this.errorMessage =
          'Dieser Titel existiert bereits. Bitte wählen sie einen anderen Titel.';
      }
    } else {
      this.errorMessage = 'Der Titel darf nicht leer sein.';
    }
  }
}
