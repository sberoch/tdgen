import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TitleActivityDialogComponent } from '../../components/title-activity-dialog/title-activity-dialog.component';
import { AboutDialogComponent } from '../../components/about-dialog/about-dialog.component';
import { TitleService } from '../../services/title.service';
import { FlyoutPanelComponent } from '../../components/flyout-panel/flyout-panel.component';
import { OverlayModalComponent } from '../../components/overlay-modal/overlay-modal.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    FlyoutPanelComponent,
    OverlayModalComponent,
  ],
})
export class HeaderComponent implements OnInit {
  currentTitle: string = '';
  isPanelOpen = false;
  isModalOpen = false;

  constructor(
    private dialog: MatDialog,
    private titleService: TitleService,
    private router: Router
  ) {}

  ngOnInit() {
    this.titleService.currentTitle.subscribe((title) => {
      if (title) this.currentTitle = title;
    });
  }

  togglePanel() {
    this.isPanelOpen = !this.isPanelOpen;
  }

  closePanel() {
    this.isPanelOpen = false;
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(TitleActivityDialogComponent, {
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.titleService.updateTitle(result);
      }
    });
  }

  openAboutDialog() {
    this.dialog.open(AboutDialogComponent, {
      width: '600px',
    });
  }

  onButtonClick() {
    alert('TODsO');
  }

  logout() {
    // Here you would typically clear any authentication tokens or user data
    // For now, we'll just navigate to the login page
    this.router.navigate(['/login']);
  }
}
