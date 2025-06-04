import { Component } from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-deleted-tasks-warning-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './deleted-tasks-warning-dialog.component.html',
})
export class DeletedTasksWarningDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<DeletedTasksWarningDialogComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }
}
