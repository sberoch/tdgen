import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SessionExpiredDialogComponent } from '../components/session-expired-dialog/session-expired-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  showSessionExpiredDialog(): void {
    this.dialog.open(SessionExpiredDialogComponent, {
      disableClose: true,
      width: '400px',
    });
  }
}