import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AboutDialogComponent } from '../../components/about-dialog/about-dialog.component';
import { FlyoutPanelComponent } from '../../components/flyout-panel/flyout-panel.component';
import { JobDescriptionTitleDialogComponent } from '../../components/job-descriptions/job-description-title-dialog/job-description-title-dialog.component';
import { JdOverviewAccordionComponent } from '../../components/job-descriptions/overview-accordion/jd-overview-accordion.component';
import { JtOverviewAccordionComponent } from '../../components/job-tasks/overview-accordion/jt-overview-accordion.component';
import { OverlayModalComponent } from '../../components/overlay-modal/overlay-modal.component';
import { CurrentWorkspaceService } from '../../services/current-workspace.service';

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
    JdOverviewAccordionComponent,
    JtOverviewAccordionComponent,
  ],
})
export class HeaderComponent implements OnInit {
  currentTitle: string = '';
  isPanelOpen = false;
  isJobDescriptionModalOpen = false;
  isJobTaskModalOpen = false;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private currentWorkspaceService: CurrentWorkspaceService
  ) {}

  ngOnInit() {
    this.currentWorkspaceService.currentJobDescription.subscribe(
      (jobDescription) => {
        this.currentTitle = jobDescription?.title || '';
      }
    );
  }

  togglePanel() {
    this.isPanelOpen = !this.isPanelOpen;
  }

  closePanel() {
    this.isPanelOpen = false;
  }

  openJobDescriptionModal() {
    this.isJobDescriptionModalOpen = true;
  }

  closeJobDescriptionModal() {
    this.isJobDescriptionModalOpen = false;
  }

  openJobTaskModal() {
    this.isJobTaskModalOpen = true;
  }

  closeJobTaskModal() {
    this.isJobTaskModalOpen = false;
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(JobDescriptionTitleDialogComponent, {
      width: '600px',
      data: {
        isEditing: false,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.currentWorkspaceService.setCurrentJobDescription(result);
      }
    });
  }

  openAboutDialog() {
    this.dialog.open(AboutDialogComponent, {
      width: '600px',
    });
  }

  onButtonClick() {
    alert('TODO');
  }

  logout() {
    // Here you would typically clear any authentication tokens or user data
    // For now, we'll just navigate to the login page
    this.router.navigate(['/login']);
  }
}
