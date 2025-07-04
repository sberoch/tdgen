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

export interface JobTaskDeleteDialogData {
  jobTask: JobTask;
  affectedCount: number;
  onConfirmCallback?: () => void;
}

@Component({
  selector: 'app-job-task-delete-confirmation-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './job-task-delete-confirmation-dialog.component.html',
})
export class JobTaskDeleteConfirmationDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<JobTaskDeleteConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: JobTaskDeleteDialogData
  ) {}

  get warningMessage(): string {
    if (this.data.affectedCount === 1) {
      return 'Bitte beachten Sie: Dieser Arbeitsvorgang ist in einer Tätigkeitsdarstellung enthalten.';
    } else {
      return `Bitte beachten Sie: Dieser Arbeitsvorgang ist in ${this.data.affectedCount} Tätigkeitsdarstellungen enthalten.`;
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
