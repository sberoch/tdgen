import { Component } from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
  MatDialogContent,
} from '@angular/material/dialog';
import gitInfo from '../../../assets/git-info.json';

@Component({
  selector: 'app-about-dialog',
  standalone: true,
  imports: [MatDialogModule, MatDialogContent],
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.css'],
})
export class AboutDialogComponent {
  version = gitInfo.version ?? 'Development';
  year = new Date().getFullYear();

  constructor(private dialogRef: MatDialogRef<AboutDialogComponent>) {}
}
