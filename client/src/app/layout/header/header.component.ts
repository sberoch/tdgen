import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AboutDialogComponent } from '../../components/about-dialog/about-dialog.component';
import { CloseDescriptionDialogComponent } from '../../components/close-description-dialog/close-description-dialog.component';
import { DeletedTasksWarningDialogComponent } from '../../components/deleted-tasks-warning-dialog/deleted-tasks-warning-dialog.component';
import { ExportDialogComponent } from '../../components/export-dialog/export-dialog.component';
import { ExportModalComponent } from '../../components/export-dialog/modal/export-modal.component';
import { FlyoutPanelComponent } from '../../components/flyout-panel/flyout-panel.component';
import { JobDescriptionTitleDialogComponent } from '../../components/job-descriptions/job-description-title-dialog/job-description-title-dialog.component';
import { JdOverviewAccordionComponent } from '../../components/job-descriptions/overview-accordion/jd-overview-accordion.component';
import { JtOverviewAccordionComponent } from '../../components/job-tasks/overview-accordion/jt-overview-accordion.component';
import { OverlayModalComponent } from '../../components/overlay-modal/overlay-modal.component';
import { AuthService } from '../../services/auth.service';
import { CurrentWorkspaceService } from '../../services/current-workspace.service';
import { EnvironmentService } from '../../services/environment.service';
import { JobDescriptionsService } from '../../services/job-descriptions.service';
import { JobDescription } from '../../types/job-descriptions';
import { User } from '../../types/user';
import { TextTooltipDirective } from '../../utils/directives/text-tooltip.directive';
import { LockService } from '../../services/lock.service';

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
    ExportModalComponent,
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
  currentUser: User | null = null;
  @ViewChild('jdAccordion') jdOverviewAccordion!: JdOverviewAccordionComponent;
  @ViewChild('jtAccordion') jtOverviewAccordion!: JtOverviewAccordionComponent;

  constructor(
    private dialog: MatDialog,
    private currentWorkspaceService: CurrentWorkspaceService,
    private jobDescriptionsService: JobDescriptionsService,
    private authService: AuthService,
    private environmentService: EnvironmentService,
    private lockService: LockService
  ) {}

  ngOnInit() {
    this.currentWorkspaceService.currentJobDescription.subscribe(
      (jobDescription) => {
        this.jobDescription = jobDescription;
        this.isWorkspaceSet = jobDescription !== null;
        this.tags = jobDescription?.tags.map((tag) => tag.name) || [];
      }
    );

    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  getHigherHierarchyRoleName(): string {
    if (
      this.currentUser?.groups.includes(this.environmentService.adminRoleName)
    ) {
      return (
        this.environmentService.adminRoleName.charAt(0).toUpperCase() +
        this.environmentService.adminRoleName.slice(1)
      );
    } else if (
      this.currentUser?.groups.includes(this.environmentService.userRoleName)
    ) {
      return (
        this.environmentService.userRoleName.charAt(0).toUpperCase() +
        this.environmentService.userRoleName.slice(1)
      );
    }
    if (this.currentUser?.groups[0]) {
      return (
        this.currentUser?.groups[0].charAt(0).toUpperCase() +
        this.currentUser?.groups[0].slice(1)
      );
    }
    return '';
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
        // Release lock on the current job description, if any, since we are no longer working with it
        if (this.jobDescription?.id) {
          this.lockService
            .releaseLock('JobDescription', this.jobDescription.id)
            .subscribe();
        }
        this.currentWorkspaceService.clearCurrentJobDescription();
      }
    });
  }

  exportDescription() {
    if (
      this.jobDescription?.tasks?.some(
        (task) =>
          task.jobTask.deletedAt !== undefined &&
          task.jobTask.deletedAt !== null
      )
    ) {
      this.dialog.open(DeletedTasksWarningDialogComponent, {
        width: '500px',
      });
      return;
    }
    this.openExportModal();
  }

  openInstructionPDF() {
    window.open('/TDGen_Manual_latest.pdf', '_blank');
  }

  openAboutDialog() {
    this.dialog.open(AboutDialogComponent, {
      width: '600px',
    });
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

  isUserAdmin(): boolean {
    return (
      this.currentUser?.groups.includes(
        this.environmentService.adminRoleName
      ) || false
    );
  }
}
