import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CurrentWorkspaceService } from '../../../services/current-workspace.service';
import { AuthService } from '../../../services/auth.service';
import { LockService } from '../../../services/lock.service';
import {
  JobDescriptionFilter,
  JobDescriptionsService,
} from '../../../services/job-descriptions.service';
import { Subscription } from 'rxjs';
import { JobDescription } from '../../../types/job-descriptions';
import { Tag } from '../../../types/tag';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog-component';
import { JobDescriptionTitleDialogComponent } from '../job-description-title-dialog/job-description-title-dialog.component';
import { LockConflictDialogComponent } from '../../lock-conflict-dialog/lock-conflict-dialog.component';
import { getTruncatedPlainText } from '../../../utils/card.utils';

interface ExpandableJobDescription extends JobDescription {
  expanded: boolean;
  isNew?: boolean;
}

@Component({
  selector: 'app-jd-overview-accordion',
  templateUrl: './jd-overview-accordion.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    FormsModule,
  ],
  providers: [DatePipe],
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({
          height: '0',
          padding: '0',
          overflow: 'hidden',
          opacity: 0,
        })
      ),
      state(
        'expanded',
        style({
          height: '*',
          padding: '*',
          overflow: 'hidden',
          opacity: 1,
        })
      ),
      transition('collapsed <=> expanded', [animate('200ms ease-in-out')]),
    ]),
  ],
})
export class JdOverviewAccordionComponent implements OnInit, AfterViewChecked {
  @Input() initialJobDescription: JobDescription | null = null;

  expandedItemId: number | null = null;
  tagInput: string = '';
  filter: JobDescriptionFilter = {};
  showOwnEntriesOnly: boolean = false;
  newlyCreatedTitle: string | null = null;
  shouldScrollToNew: boolean = false;
  totalJobDescriptionsCount: number = 0;
  filteredJobDescriptionsCount: number = 0;
  @ViewChildren('accordionItem') accordionItems!: QueryList<ElementRef>;
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @Output() closeModal = new EventEmitter<void>();

  jobDescriptions: ExpandableJobDescription[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private dialog: MatDialog,
    private jobDescriptionsService: JobDescriptionsService,
    private currentWorkspaceService: CurrentWorkspaceService,
    private authService: AuthService,
    private lockService: LockService
  ) {}

  ngOnInit(): void {
    this.loadJobDescriptions();

    // Subscribe to lock conflicts
    this.subscription.add(
      this.lockService.lockConflict$.subscribe((conflict) => {
        this.dialog.open(LockConflictDialogComponent, {
          width: '500px',
          data: {
            lockedById: conflict.lockInfo.lockedById || 'Unknown',
            entityType: conflict.entityType,
          },
        });
      })
    );
  }

  ngOnDestroy(): void {
    // Release lock if currently holding one
    if (this.expandedItemId) {
      this.lockService
        .releaseLock('JobDescription', this.expandedItemId)
        .subscribe();
    }
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['initialJobDescription'] &&
      changes['initialJobDescription'].currentValue
    ) {
      this.loadJobDescriptions();
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToNew) {
      this.scrollToNewItem();
      this.shouldScrollToNew = false;
    }
  }

  scrollToNewItem() {
    const newItemIndex = this.jobDescriptions.findIndex((jd) => jd.isNew);

    if (newItemIndex >= 0 && this.accordionItems.length > newItemIndex) {
      setTimeout(() => {
        const newItemElement =
          this.accordionItems.toArray()[newItemIndex].nativeElement;
        const scrollContainer = this.scrollContainer.nativeElement;

        const containerRect = scrollContainer.getBoundingClientRect();
        const itemRect = newItemElement.getBoundingClientRect();

        const currentScrollTop = scrollContainer.scrollTop;

        const newScrollTop =
          currentScrollTop + (itemRect.top - containerRect.top) - 50;

        scrollContainer.scrollTo({
          top: newScrollTop,
          behavior: 'smooth',
        });
      }, 50);
    }
  }

  loadJobDescriptions(): void {
    this.jobDescriptionsService.getJobDescriptions(this.filter).subscribe({
      next: (data) => {
        this.totalJobDescriptionsCount = data.totalCount;
        this.filteredJobDescriptionsCount = data.jobDescriptions.length;
        this.jobDescriptions = data.jobDescriptions.map((jd) => ({
          ...jd,
          expanded:
            this.newlyCreatedTitle !== null &&
            jd.title === this.newlyCreatedTitle,
          isNew:
            (this.newlyCreatedTitle !== null &&
              jd.title === this.newlyCreatedTitle) ||
            (this.initialJobDescription !== null &&
              jd.title === this.initialJobDescription.title),
        }));

        if (
          this.newlyCreatedTitle !== null ||
          this.initialJobDescription !== null
        ) {
          this.shouldScrollToNew = true;

          const targetTitle =
            this.initialJobDescription?.title || this.newlyCreatedTitle;
          const newItem = this.jobDescriptions.find(
            (jd) => jd.title === targetTitle
          );
          if (newItem && newItem.id) {
            this.expandedItemId = newItem.id;
          }

          setTimeout(() => {
            this.newlyCreatedTitle = null;
            this.jobDescriptions = this.jobDescriptions.map((jd) => ({
              ...jd,
              isNew: false,
            }));
          }, 100);
        }
      },
      error: (error) => {
        console.error('Error loading job descriptions:', error);
      },
    });
  }

  applyFilter(newFilter: Partial<JobDescriptionFilter>): void {
    this.filter = { ...this.filter, ...newFilter };
    this.loadJobDescriptions();
  }

  applyOwnEntriesFilter(): void {
    const currentUser = this.authService.getCurrentUser();
    if (this.showOwnEntriesOnly && currentUser?.id) {
      this.applyFilter({ createdById: currentUser.id });
    } else {
      this.applyFilter({ createdById: undefined });
    }
  }

  clearFilter(): void {
    this.filter = {};
    this.loadJobDescriptions();
  }

  clearInput(inputElement: HTMLInputElement) {
    inputElement.value = '';
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
        this.newlyCreatedTitle = result.title;
        const currentJd =
          this.currentWorkspaceService.getCurrentJobDescriptionValue();
        if (currentJd && currentJd.id === result.id) {
          this.currentWorkspaceService.setCurrentJobDescription(result);
        }
        this.loadJobDescriptions();
      }
    });
  }

  openEditDialog(item: JobDescription, event: Event) {
    event.stopPropagation();

    const dialogRef = this.dialog.open(JobDescriptionTitleDialogComponent, {
      width: '600px',
      data: {
        title: item.title,
        id: item.id,
        isEditing: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.newlyCreatedTitle = result.title;
        const currentJd =
          this.currentWorkspaceService.getCurrentJobDescriptionValue();
        if (currentJd && currentJd.id === result.id) {
          this.currentWorkspaceService.setCurrentJobDescription(result);
        }
        this.loadJobDescriptions();
      }
    });
  }

  truncate(text: string, maxLength: number): string {
    return getTruncatedPlainText(text, maxLength);
  }

  toggleAccordion(id: number): void {
    const currentUser = this.authService.getCurrentUser();
    const itemToToggle = this.jobDescriptions.find((jd) => jd.id === id);

    // Prevent toggling if locked by another user
    if (
      itemToToggle?.lockedById &&
      itemToToggle.lockedById !== currentUser?.id
    ) {
      return; // Do nothing, row should appear disabled
    }

    if (this.expandedItemId === id) {
      // Collapsing - release lock
      this.lockService.releaseLock('JobDescription', id).subscribe({
        next: () => {
          // Update local state to reflect lock release
          if (itemToToggle) {
            itemToToggle.lockedById = undefined;
            itemToToggle.lockedAt = undefined;
            itemToToggle.lockExpiry = undefined;
          }
        },
        error: (err) => console.error('Error releasing lock:', err),
      });
      this.expandedItemId = null;
    } else {
      // Expanding - acquire lock first
      this.lockService.acquireLock('JobDescription', id).subscribe({
        next: (success) => {
          if (success) {
            this.expandedItemId = id;
            // Update local lock status
            if (itemToToggle) {
              itemToToggle.lockedById = currentUser?.id;
              itemToToggle.lockedAt = new Date().toISOString();
            }
          } else {
            this.dialog.open(LockConflictDialogComponent, {
              width: '500px',
              data: {
                lockedById: itemToToggle?.lockedById || 'Unknown',
                entityType: 'JobDescription',
              },
            });
          }
        },
        error: (err) => {
          console.error('Error acquiring lock:', err);
        },
      });
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedItemId === id;
  }

  getAccordionState(id: number): string {
    return this.isExpanded(id) ? 'expanded' : 'collapsed';
  }

  isLockedByOtherUser(item: JobDescription): boolean {
    const currentUser = this.authService.getCurrentUser();
    return !!item.lockedById && item.lockedById !== currentUser?.id;
  }

  getTaskCountDisplay(item: JobDescription): string {
    const taskCount = item.taskCount;
    const weightedAverage = item.weightedAverage.toFixed(2);

    if (taskCount === 1) {
      return `Enthält einen Arbeitsvorgang (Entgeltgruppe Ø: ${weightedAverage}).`;
    } else {
      return `Enthält ${taskCount} Arbeitsvorgänge (Entgeltgruppe Ø: ${weightedAverage}).`;
    }
  }

  addTags(item: JobDescription): void {
    if (!this.tagInput.trim()) return;

    const newTags = this.tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag)
      .map((name) => ({ id: Math.random(), name }));

    if (!item.tags) item.tags = [];
    const existingTagNames = new Set(item.tags.map((tag) => tag.name));
    const uniqueNewTags = newTags.filter(
      (newTag) => !existingTagNames.has(newTag.name)
    );
    item.tags = [...item.tags, ...uniqueNewTags];
    this.tagInput = '';

    this.jobDescriptionsService
      .updateJobDescription(item.id, {
        tags: item.tags.map((tag) => tag.name),
      })
      .subscribe();
  }

  removeTag(item: JobDescription, tagToRemove: Tag): void {
    if (!item.tags) return;
    item.tags = item.tags.filter((tag) => tag.name !== tagToRemove.name);
    this.jobDescriptionsService
      .updateJobDescription(item.id, {
        tags: item.tags.map((tag) => tag.name),
      })
      .subscribe();
  }

  handleKeyPress(event: KeyboardEvent, item: JobDescription): void {
    if (event.key === 'Enter') {
      this.addTags(item);
    }
  }

  deleteItem(item: JobDescription): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eintrag löschen?',
        onConfirmCallback: () => {
          this.jobDescriptionsService.deleteJobDescription(item.id).subscribe({
            next: () => {
              this.loadJobDescriptions();
            },
            error: (error) => {
              console.error('Error deleting job description:', error);
            },
          });
        },
      },
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  softDeleteItem(item: JobDescription): void {
    this.deleteItem(item);
  }

  permanentDeleteItem(item: JobDescription): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eintrag permanent löschen?',
        onConfirmCallback: () => {
          this.jobDescriptionsService
            .permanentDeleteJobDescription(item.id)
            .subscribe({
              next: () => {
                this.loadJobDescriptions();
              },
              error: (error) => {
                console.error(
                  'Error permanently deleting job description:',
                  error
                );
              },
            });
        },
      },
    });
  }

  restoreItem(item: JobDescription): void {
    this.jobDescriptionsService.restoreJobDescription(item.id).subscribe({
      next: () => {
        this.loadJobDescriptions();
      },
      error: (error) => {
        console.error('Error restoring job description:', error);
      },
    });
  }

  breakLock(item: JobDescription): void {
    this.lockService.breakLock('JobDescription', item.id!).subscribe({
      next: (response) => {
        // Update local state to clear lock fields
        item.lockedById = undefined;
        item.lockedAt = undefined;
        item.lockExpiry = undefined;
      },
      error: (err) => console.error('Error breaking lock:', err),
    });
  }

  loadJobDescriptionIntoWorkplace(item: JobDescription): void {
    const isCurrentlyExpanded = this.expandedItemId === item.id;

    // If not currently expanded, acquire lock for workplace editing
    if (!isCurrentlyExpanded && item.id) {
      this.lockService.acquireLock('JobDescription', item.id).subscribe({
        next: (success) => {
          if (success) {
            // Update local state to reflect lock acquisition
            item.lockedById = this.authService.getCurrentUser()?.id;
            item.lockedAt = new Date().toISOString();
          }
        },
        error: (err) => console.error('Error acquiring lock for workplace:', err),
      });
    }

    this.currentWorkspaceService.triggerJobDescriptionFetch(item);
    this.currentWorkspaceService.setCurrentJobDescription(item);

    // Keep lock only if this is the currently expanded item
    this.onOverlayModalClosed({ keepLock: isCurrentlyExpanded });
  }

  resetSearchInput(): void {
    this.filter = {};
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
  }

  resetFiltersAndInput(): void {
    this.filter = {};
    this.showOwnEntriesOnly = false;
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
    this.loadJobDescriptions();
  }

  onOverlayModalClosed(options: { keepLock?: boolean } = {}): void {
    const expandedItem = this.jobDescriptions.find(
      (jd) => jd.id === this.expandedItemId
    );
    if (expandedItem && expandedItem.id) {
      this.addTags(expandedItem);

      this.jobDescriptionsService
        .updateJobDescription(expandedItem.id, {
          title: expandedItem.title,
          metadata: expandedItem.metadata,
          tags: expandedItem.tags.map((tag) => tag.name),
        })
        .subscribe({
          next: (response) => {
            if (
              response.id ===
              this.currentWorkspaceService.getCurrentJobDescriptionValue()?.id
            ) {
              this.currentWorkspaceService.setCurrentJobDescription(response);
            }
          },
          error: (error) => {
            console.error(
              'Error updating job description on modal close:',
              error
            );
          },
        });
    }

    // Release lock when overlay closes (unless keeping lock for workplace)
    if (this.expandedItemId && !options.keepLock) {
      const itemToRelease = this.jobDescriptions.find(
        (jd) => jd.id === this.expandedItemId
      );

      this.lockService
        .releaseLock('JobDescription', this.expandedItemId)
        .subscribe({
          next: () => {
            // Update local state to reflect lock release
            if (itemToRelease) {
              itemToRelease.lockedById = undefined;
              itemToRelease.lockedAt = undefined;
              itemToRelease.lockExpiry = undefined;
            }
          },
          error: (err) => console.error('Error releasing lock on overlay close:', err),
        });

      // Reset expanded state
      this.expandedItemId = null;
    }

    this.closeModal.emit();
  }
}
