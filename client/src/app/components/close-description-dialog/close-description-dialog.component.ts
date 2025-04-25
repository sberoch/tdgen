import { Component } from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TitleService } from '../../services/title.service';

@Component({
  selector: 'app-close-description-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
  templateUrl: './close-description-dialog.component.html',
})
export class CloseDescriptionDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<CloseDescriptionDialogComponent>,
    private titleService: TitleService
  ) {}

  onConfirm(): void {
    this.titleService.updateTitle('');
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
