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

  private readonly titleRegex = /^[A-Za-zäöüÄÖÜß0-9\-\s().,/]{1,100}$/;
  private readonly invalidInputMessage =
    'Ungültige Eingabe: Erlaubt sind maximal 100 Zeichen, bestehend aus Groß- und Kleinbuchstaben, Zahlen, Leerzeichen, Bindestrich (-), Punkt (.), Komma (,), Schrägstrich (/) sowie runden Klammern ().';

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
  }
}
