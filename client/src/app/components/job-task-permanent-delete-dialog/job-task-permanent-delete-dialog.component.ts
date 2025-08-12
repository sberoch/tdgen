import { Component, Inject } from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
  MatDialogContent,
  MatDialogActions,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { JobTask } from '../../types/job-tasks';
import { CommonModule } from '@angular/common';

export interface JobTaskPermanentDeleteDialogData {
  jobTask: JobTask;
  affectedCount: number;
  onConfirmCallback?: () => void;
}

@Component({
  selector: 'app-job-task-permanent-delete-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './job-task-permanent-delete-dialog.component.html',
})
export class JobTaskPermanentDeleteDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<JobTaskPermanentDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: JobTaskPermanentDeleteDialogData
  ) {}

  get explanatoryText(): string {
    return 'Zusätzlich zum Eintrag werden auch sämtliche Verweise auf diesen Arbeitsvorgang in allen Tätigkeitsdarstellungen gelöscht.';
  }

  get affectedMessage(): string {
    if (this.data.affectedCount === 0) {
      return 'Dieser Arbeitsvorgang ist in keiner Tätigkeitsdarstellung enthalten.';
    } else if (this.data.affectedCount === 1) {
      return 'Dieser Arbeitsvorgang wird aus einer Tätigkeitsdarstellung entfernt.';
    } else {
      return `Dieser Arbeitsvorgang wird aus ${this.data.affectedCount} Tätigkeitsdarstellungen entfernt.`;
    }
  }

  onConfirm(): void {
    if (this.data.onConfirmCallback) {
      this.data.onConfirmCallback();
    }
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}