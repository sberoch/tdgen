import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { JobTask, CreateJobTask } from '../../../types/job-tasks';

export interface JobTaskTitleDialogData {
  title?: string;
  id?: number;
  isEditing?: boolean;
}

@Component({
  selector: 'app-job-task-title-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './job-task-title-dialog.component.html',
  styleUrls: ['./job-task-title-dialog.component.css'],
})
export class JobTaskTitleDialogComponent {
  title: string = '';
  errorMessage: string = '';
  isEditing: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<JobTaskTitleDialogComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: JobTaskTitleDialogData
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
          `${environment.apiUrl}api/job-tasks/exists?title=${this.title.trim()}`
        )
      );

      const data: CreateJobTask = {
        title: this.title.trim(),
        metadata: {},
        tags: [],
        text: '',
      };

      if (!exists) {
        if (!this.isEditing) {
          await firstValueFrom(
            this.http.post<CreateJobTask>(
              `${environment.apiUrl}api/job-tasks`,
              data
            )
          );
          this.dialogRef.close(this.title.trim());
        } else {
          await firstValueFrom(
            this.http.patch<JobTask>(
              `${environment.apiUrl}api/job-tasks/${this.data.id}`,
              data
            )
          );
          this.dialogRef.close(this.title.trim());
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
