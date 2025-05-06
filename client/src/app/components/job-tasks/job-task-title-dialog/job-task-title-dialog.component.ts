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
import { JobTasksService } from '../../../services/job-tasks.service';

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
    private jobTasksService: JobTasksService,
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
    const trimmedTitle = this.title.trim();
    if (trimmedTitle) {
      this.jobTasksService.existsByTitle(trimmedTitle).subscribe({
        next: (exists) => {
          if (exists) {
            this.errorMessage =
              'Dieser Titel existiert bereits. Bitte wählen sie einen anderen Titel.';
          } else {
            if (!this.isEditing) {
              this.jobTasksService
                .createJobTask({
                  title: trimmedTitle,
                  metadata: {},
                  tags: [],
                  text: '',
                })
                .subscribe({
                  next: () => {
                    this.dialogRef.close(trimmedTitle);
                  },
                  error: (err) => {
                    this.errorMessage =
                      'Fehler beim Erstellen der Aufgabe: ' + err.message;
                  },
                });
            } else {
              this.jobTasksService
                .updateJobTask(this.data.id!, {
                  title: trimmedTitle,
                })
                .subscribe({
                  next: () => {
                    this.dialogRef.close(trimmedTitle);
                  },
                  error: (err) => {
                    this.errorMessage =
                      'Fehler beim Aktualisieren der Aufgabe: ' + err.message;
                  },
                });
            }
          }
        },
        error: (err) => {
          this.errorMessage =
            'Fehler bei der Überprüfung des Titels: ' + err.message;
        },
      });
    } else {
      this.errorMessage = 'Der Titel darf nicht leer sein.';
    }
  }
}
