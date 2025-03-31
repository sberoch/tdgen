import { Component } from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
  MatDialogContent,
} from '@angular/material/dialog';
import packageJson from '../../../../package.json';

@Component({
  selector: 'app-about-dialog',
  standalone: true,
  imports: [MatDialogModule, MatDialogContent],
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.css'],
})
export class AboutDialogComponent {
  version = packageJson.version ?? '1.0.0';
  year = new Date().getFullYear();

  constructor(private dialogRef: MatDialogRef<AboutDialogComponent>) {}
}
