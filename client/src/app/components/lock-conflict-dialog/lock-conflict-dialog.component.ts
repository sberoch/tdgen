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

export interface LockConflictDialogData {
  lockedById: string;
  entityType: 'JobTask' | 'JobDescription';
}

@Component({
  selector: 'app-lock-conflict-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './lock-conflict-dialog.component.html',
})
export class LockConflictDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<LockConflictDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LockConflictDialogData
  ) {}

  close() {
    this.dialogRef.close();
  }
}
