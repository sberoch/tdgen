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
  selector: 'app-insufficient-rights-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './insufficient-rights-dialog.component.html',
})
export class InsufficientRightsDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<InsufficientRightsDialogComponent>,
  ) {}

  close() {
    this.dialogRef.close();
  }
}
