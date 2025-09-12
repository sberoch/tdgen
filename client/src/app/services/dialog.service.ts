import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SessionExpiredDialogComponent } from '../components/session-expired-dialog/session-expired-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private sessionExpiredDialogOpen = false;
  private isInitialLoad = true;

  constructor(private dialog: MatDialog) {}

  showSessionExpiredDialog(): void {
    // Skip dialog during initial page load
    if (this.isInitialLoad) {
      return;
    }

    if (this.sessionExpiredDialogOpen) {
      return;
    }

    this.sessionExpiredDialogOpen = true;
    const dialogRef = this.dialog.open(SessionExpiredDialogComponent, {
      disableClose: true,
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.sessionExpiredDialogOpen = false;
    });
  }

  notifyInitialAuthCompleted(): void {
    this.isInitialLoad = false;
  }
}