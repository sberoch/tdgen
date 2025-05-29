import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AboutDialogComponent } from '../../components/about-dialog/about-dialog.component';
import { CloseDescriptionDialogComponent } from '../../components/close-description-dialog/close-description-dialog.component';
import { FlyoutPanelComponent } from '../../components/flyout-panel/flyout-panel.component';
import { JobDescriptionTitleDialogComponent } from '../../components/job-descriptions/job-description-title-dialog/job-description-title-dialog.component';
import { JdOverviewAccordionComponent } from '../../components/job-descriptions/overview-accordion/jd-overview-accordion.component';
import { JtOverviewAccordionComponent } from '../../components/job-tasks/overview-accordion/jt-overview-accordion.component';
import { OverlayModalComponent } from '../../components/overlay-modal/overlay-modal.component';
import { CurrentWorkspaceService } from '../../services/current-workspace.service';
import { JobDescriptionsService } from '../../services/job-descriptions.service';
import { JobDescription } from '../../types/job-descriptions';
import { ExportDialogComponent } from '../../components/export-dialog/export-dialog.component';
import { TextTooltipDirective } from '../../utils/directives/text-tooltip.directive';

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
    ExportDialogComponent,
    CommonModule,
    TextTooltipDirective,
  ],
})
export class HeaderComponent implements OnInit {
  jobDescription: JobDescription | null = null;
  tags: string[] = [];
  isPanelOpen = false;
  isJobDescriptionModalOpen = false;
  isJobTaskModalOpen = false;
  isExportModalOpen = false;
  isWorkspaceSet: boolean = false;
  @ViewChild('jdAccordion') jdOverviewAccordion!: JdOverviewAccordionComponent;
  @ViewChild('jtAccordion') jtOverviewAccordion!: JtOverviewAccordionComponent;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private currentWorkspaceService: CurrentWorkspaceService,
    private jobDescriptionsService: JobDescriptionsService
  ) {}

  ngOnInit() {
    this.currentWorkspaceService.currentJobDescription.subscribe(
      (jobDescription) => {
        this.jobDescription = jobDescription;
        this.isWorkspaceSet = jobDescription !== null;
        this.tags = jobDescription?.tags.map((tag) => tag.name) || [];
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
    this.jobDescriptionsService.getJobDescriptions().subscribe();
    setTimeout(() => {
      if (this.jdOverviewAccordion) {
        this.jdOverviewAccordion.resetFiltersAndInput();
      }
    }, 0);
  }

  closeJobDescriptionModal() {
    this.isJobDescriptionModalOpen = false;
  }

  openJobTaskModal() {
    this.isJobTaskModalOpen = true;
    setTimeout(() => {
      if (this.jtOverviewAccordion) {
        this.jtOverviewAccordion.resetFiltersAndInput();
      }
    }, 0);
  }

  closeJobTaskModal() {
    this.isJobTaskModalOpen = false;
  }

  openExportModal() {
    this.isExportModalOpen = true;
  }

  closeExportModal() {
    this.isExportModalOpen = false;
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
        this.jobDescriptionsService.getJobDescriptions().subscribe();
      }
    });
  }

  openCloseDescriptionDialog() {
    const dialogRef = this.dialog.open(CloseDescriptionDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.currentWorkspaceService.clearCurrentJobDescription();
      }
    });
  }

  exportDescription() {
    console.log({ jobDescription: this.jobDescription });
    if (
      this.jobDescription?.tasks?.some(
        (task) =>
          task.jobTask.deletedAt !== undefined &&
          task.jobTask.deletedAt !== null
      )
    ) {
      alert(
        "Bitte entfernen Sie vor dem Exportieren zunächst die nicht mehr existierenden Arbeitsvorgänge (Eintrag 'Entfernen' im Dreipunkt-Menu)."
      );
      return;
    }
    this.openExportModal();
  }

  openAboutDialog() {
    this.dialog.open(AboutDialogComponent, {
      width: '600px',
    });
  }

  logout() {
    // Here you would typically clear any authentication tokens or user data
    // For now, we'll just navigate to the login page
    this.router.navigate(['/login']);
  }

  get displayedTags(): string[] {
    return this.tags.slice(0, 5);
  }

  get hasMoreTags(): boolean {
    return this.tags.length > 5;
  }

  get allTagsText(): string {
    return this.tags.join(', ');
  }
}
