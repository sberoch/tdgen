import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-activity-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './activity-dialog.component.html',
  styleUrls: ['./activity-dialog.component.css'],
})
export class ActivityDialogComponent {
  title: string = '';

  constructor(private dialogRef: MatDialogRef<ActivityDialogComponent>) {}

  onAccept() {
    if (this.title.trim()) {
      this.dialogRef.close(this.title.trim());
    }
  }
}
