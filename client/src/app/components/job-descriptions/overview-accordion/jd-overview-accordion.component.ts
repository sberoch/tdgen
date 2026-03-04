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
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CurrentWorkspaceService } from '../../../services/current-workspace.service';
import { AuthService } from '../../../services/auth.service';
import { LockService } from '../../../services/lock.service';
import { SseService } from '../../../services/sse.service';
import {
  JobDescriptionFilter,
  JobDescriptionsService,
} from '../../../services/job-descriptions.service';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { JobDescription } from '../../../types/job-descriptions';
import { Tag } from '../../../types/tag';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog-component';
import { JobDescriptionTitleDialogComponent } from '../job-description-title-dialog/job-description-title-dialog.component';
import { LockConflictDialogComponent } from '../../lock-conflict-dialog/lock-conflict-dialog.component';
import { getTruncatedPlainText } from '../../../utils/card.utils';
import {
  validateFilterToken,
  extractFilters,
  TOKEN_REGEX,
  FilterContext,
} from '../../../columns/card-backlog-column/card-backlog-column.utils';

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
        }),
      ),
      state(
        'expanded',
        style({
          height: '*',
          padding: '*',
          overflow: 'hidden',
          opacity: 1,
        }),
      ),
      transition('collapsed <=> expanded', [animate('200ms ease-in-out')]),
    ]),
  ],
  styles: [
    `
      .search-backdrop {
        line-height: normal;
      }

      :host ::ng-deep .token-valid {
        background-color: #e0e0e0;
        font-style: italic;
        border-radius: 3px;
        box-shadow: -2px 0 0 #e0e0e0, 2px 0 0 #e0e0e0;
      }

      :host ::ng-deep .token-invalid {
        background-color: #fecaca;
        color: #dc2626;
        font-style: italic;
        border-radius: 3px;
        box-shadow: -2px 0 0 #fecaca, 2px 0 0 #fecaca;
      }
    `,
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
  @ViewChild('searchArea') searchArea!: ElementRef<HTMLElement>;
  @ViewChild('tooltipOverlay') tooltipOverlayRef?: ElementRef<HTMLElement>;
  @Output() closeModal = new EventEmitter<void>();

  // Search overlay properties
  highlightedSearchHtml: SafeHtml = '';
  tooltipOverlayHtml: SafeHtml = '';
  filterTooltipText: string = '';
  filterTooltipVisible: boolean = false;
  filterTooltipLeft: number = 0;
  isHelpPanelOpen: boolean = false;
  private filterContext: FilterContext = 'jd';
  private searchSubject$ = new Subject<string>();
  private currentSearchRawValue: string = '';

  jobDescriptions: ExpandableJobDescription[] = [];
  private subscription: Subscription = new Subscription();
  private loadJobDescriptionsSubscription?: Subscription;

  constructor(
    private dialog: MatDialog,
    private jobDescriptionsService: JobDescriptionsService,
    private currentWorkspaceService: CurrentWorkspaceService,
    private authService: AuthService,
    private lockService: LockService,
    private sseService: SseService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
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
      }),
    );

    // Subscribe to jobDescriptions$ observable for real-time updates
    this.subscription.add(
      this.jobDescriptionsService.jobDescriptions$.subscribe((descriptions) => {
        // Update local descriptions array when service emits new data
        this.jobDescriptions = descriptions.map((desc) => ({
          ...desc,
          expanded: false,
          isNew: false,
        })) as ExpandableJobDescription[];
        this.cdr.markForCheck();
      }),
    );

    // Debounced search
    this.subscription.add(
      this.searchSubject$.pipe(debounceTime(300)).subscribe((rawValue) => {
        const { filters, freeText } = extractFilters(rawValue, this.filterContext);
        const combinedFilter: JobDescriptionFilter = {
          includeDeleted: undefined,
          createdById: this.showOwnEntriesOnly
            ? this.authService.getCurrentUser()?.id
            : undefined,
          search: freeText || undefined,
          ...filters,
        };
        this.filter = combinedFilter;
        this.loadJobDescriptions();
      }),
    );
  }

  ngOnDestroy(): void {
    // Release lock if currently holding one
    if (this.expandedItemId) {
      this.lockService
        .releaseLock('JobDescription', this.expandedItemId)
        .subscribe();
    }
    if (this.loadJobDescriptionsSubscription) {
      this.loadJobDescriptionsSubscription.unsubscribe();
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
    if (this.loadJobDescriptionsSubscription) {
      this.loadJobDescriptionsSubscription.unsubscribe();
    }

    this.loadJobDescriptionsSubscription = this.jobDescriptionsService
      .getJobDescriptions(this.filter)
      .subscribe({
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
              (jd) => jd.title === targetTitle,
            );
            if (newItem && newItem.id) {
              // Acquire lock and expand
              this.expandAndAcquireLock(newItem.id);
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

    // Acquire lock before opening edit dialog
    this.lockService.acquireLock('JobDescription', item.id).subscribe({
      next: (success) => {
        if (success) {
          // Update local lock status
          const currentUser = this.authService.getCurrentUser();
          item.lockedById = currentUser?.id;
          item.lockedAt = new Date().toISOString();

          const dialogRef = this.dialog.open(
            JobDescriptionTitleDialogComponent,
            {
              width: '600px',
              data: {
                title: item.title,
                id: item.id,
                isEditing: true,
              },
            },
          );

          dialogRef.afterClosed().subscribe((result) => {
            // Release lock after dialog closes
            this.lockService.releaseLock('JobDescription', item.id).subscribe({
              next: () => {
                // Update local state to reflect lock release
                item.lockedById = undefined;
                item.lockedAt = undefined;
                item.lockExpiry = undefined;
              },
              error: (err) =>
                console.error('Error releasing lock after title edit:', err),
            });

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
        } else {
          // Lock acquisition failed - show conflict dialog
          this.dialog.open(LockConflictDialogComponent, {
            width: '500px',
            data: {
              lockedById: item.lockedById || 'Unbekannt',
              entityType: 'JobDescription',
            },
          });
        }
      },
      error: (err) => {
        console.error('Error acquiring lock for title edit:', err);
      },
    });
  }

  truncate(text: string, maxLength: number): string {
    return getTruncatedPlainText(text, maxLength);
  }

  toggleAccordion(id: number): void {
    const currentUser = this.authService.getCurrentUser();
    const itemToToggle = this.jobDescriptions.find((jd) => jd.id === id);

    // Prevent toggling if locked by another user (unless readonly mode)
    if (
      itemToToggle?.lockedById &&
      itemToToggle.lockedById !== currentUser?.id
    ) {
      return; // Do nothing, row should appear disabled
    }

    if (this.expandedItemId === id) {
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
      this.expandAndAcquireLock(id);
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

  isItemLockedForCurrentUser(item: JobDescription): boolean {
    return !!item.isLockedForUsers && !this.isAdmin();
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
      (newTag) => !existingTagNames.has(newTag.name),
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
    // Acquire lock before deleting
    this.lockService.acquireLock('JobDescription', item.id).subscribe({
      next: (success) => {
        if (success) {
          // Update local lock status
          const currentUser = this.authService.getCurrentUser();
          item.lockedById = currentUser?.id;
          item.lockedAt = new Date().toISOString();

          this.dialog
            .open(ConfirmDialogComponent, {
              width: '400px',
              data: {
                title: 'Eintrag löschen?',
                onConfirmCallback: () => {
                  this.jobDescriptionsService
                    .deleteJobDescription(item.id)
                    .subscribe({
                      next: () => {
                        // Release lock after successful deletion
                        this.lockService
                          .releaseLock('JobDescription', item.id)
                          .subscribe({
                            next: () => {
                              item.lockedById = undefined;
                              item.lockedAt = undefined;
                              item.lockExpiry = undefined;
                            },
                            error: (err) =>
                              console.error(
                                'Error releasing lock after delete:',
                                err,
                              ),
                          });
                        this.loadJobDescriptions();
                      },
                      error: (error) => {
                        console.error('Error deleting job description:', error);
                        // Release lock on error
                        this.lockService
                          .releaseLock('JobDescription', item.id)
                          .subscribe();
                      },
                    });
                },
              },
            })
            .afterClosed()
            .subscribe((confirmed) => {
              // Release lock if user cancelled
              if (!confirmed) {
                this.lockService
                  .releaseLock('JobDescription', item.id)
                  .subscribe({
                    next: () => {
                      item.lockedById = undefined;
                      item.lockedAt = undefined;
                      item.lockExpiry = undefined;
                    },
                    error: (err) =>
                      console.error('Error releasing lock after cancel:', err),
                  });
              }
            });
        } else {
          // Lock acquisition failed - show conflict dialog
          this.dialog.open(LockConflictDialogComponent, {
            width: '500px',
            data: {
              lockedById: item.lockedById || 'Unbekannt',
              entityType: 'JobDescription',
            },
          });
        }
      },
      error: (err) => {
        console.error('Error acquiring lock for delete:', err);
      },
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  toggleLockForUsers(item: JobDescription, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isLocked = checkbox.checked;

    this.jobDescriptionsService
      .updateJobDescription(item.id, { isLockedForUsers: isLocked })
      .subscribe({
        next: (updatedJd) => {
          const index = this.jobDescriptions.findIndex(
            (jd) => jd.id === item.id,
          );
          if (index !== -1) {
            this.jobDescriptions[index] = {
              ...this.jobDescriptions[index],
              isLockedForUsers: isLocked,
            };
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error updating lock status', error);
          checkbox.checked = !isLocked; // Revert on error
        },
      });
  }

  softDeleteItem(item: JobDescription): void {
    // softDeleteItem delegates to deleteItem, which now handles lock acquisition
    this.deleteItem(item);
  }

  permanentDeleteItem(item: JobDescription): void {
    // Acquire lock before permanent deletion
    this.lockService.acquireLock('JobDescription', item.id).subscribe({
      next: (success) => {
        if (success) {
          // Update local lock status
          const currentUser = this.authService.getCurrentUser();
          item.lockedById = currentUser?.id;
          item.lockedAt = new Date().toISOString();

          this.dialog
            .open(ConfirmDialogComponent, {
              width: '400px',
              data: {
                title: 'Eintrag permanent löschen?',
                onConfirmCallback: () => {
                  this.jobDescriptionsService
                    .permanentDeleteJobDescription(item.id)
                    .subscribe({
                      next: () => {
                        // Release lock after successful deletion
                        this.lockService
                          .releaseLock('JobDescription', item.id)
                          .subscribe({
                            next: () => {
                              item.lockedById = undefined;
                              item.lockedAt = undefined;
                              item.lockExpiry = undefined;
                            },
                            error: (err) =>
                              console.error(
                                'Error releasing lock after permanent delete:',
                                err,
                              ),
                          });
                        this.loadJobDescriptions();
                      },
                      error: (error) => {
                        console.error(
                          'Error permanently deleting job description:',
                          error,
                        );
                        // Release lock on error
                        this.lockService
                          .releaseLock('JobDescription', item.id)
                          .subscribe();
                      },
                    });
                },
              },
            })
            .afterClosed()
            .subscribe((confirmed) => {
              // Release lock if user cancelled
              if (!confirmed) {
                this.lockService
                  .releaseLock('JobDescription', item.id)
                  .subscribe({
                    next: () => {
                      item.lockedById = undefined;
                      item.lockedAt = undefined;
                      item.lockExpiry = undefined;
                    },
                    error: (err) =>
                      console.error('Error releasing lock after cancel:', err),
                  });
              }
            });
        } else {
          // Lock acquisition failed - show conflict dialog
          this.dialog.open(LockConflictDialogComponent, {
            width: '500px',
            data: {
              lockedById: item.lockedById || 'Unbekannt',
              entityType: 'JobDescription',
            },
          });
        }
      },
      error: (err) => {
        console.error('Error acquiring lock for permanent delete:', err);
      },
    });
  }

  restoreItem(item: JobDescription): void {
    // Acquire lock before restoring
    this.lockService.acquireLock('JobDescription', item.id).subscribe({
      next: (success) => {
        if (success) {
          // Update local lock status
          const currentUser = this.authService.getCurrentUser();
          item.lockedById = currentUser?.id;
          item.lockedAt = new Date().toISOString();

          this.jobDescriptionsService.restoreJobDescription(item.id).subscribe({
            next: () => {
              // Release lock after successful restore
              this.lockService
                .releaseLock('JobDescription', item.id)
                .subscribe({
                  next: () => {
                    item.lockedById = undefined;
                    item.lockedAt = undefined;
                    item.lockExpiry = undefined;
                  },
                  error: (err) =>
                    console.error('Error releasing lock after restore:', err),
                });
              this.loadJobDescriptions();
            },
            error: (error) => {
              console.error('Error restoring job description:', error);
              // Release lock on error
              this.lockService
                .releaseLock('JobDescription', item.id)
                .subscribe();
            },
          });
        } else {
          // Lock acquisition failed - show conflict dialog
          this.dialog.open(LockConflictDialogComponent, {
            width: '500px',
            data: {
              lockedById: item.lockedById || 'Unbekannt',
              entityType: 'JobDescription',
            },
          });
        }
      },
      error: (err) => {
        console.error('Error acquiring lock for restore:', err);
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

  private expandAndAcquireLock(descriptionId: number): void {
    const currentUser = this.authService.getCurrentUser();
    const itemToExpand = this.jobDescriptions.find(
      (jd) => jd.id === descriptionId,
    );

    this.lockService.acquireLock('JobDescription', descriptionId).subscribe({
      next: (success) => {
        if (success) {
          this.expandedItemId = descriptionId;
          // Update local lock status
          if (itemToExpand) {
            itemToExpand.lockedById = currentUser?.id;
            itemToExpand.lockedAt = new Date().toISOString();
          }
        } else {
          this.dialog.open(LockConflictDialogComponent, {
            width: '500px',
            data: {
              lockedById: itemToExpand?.lockedById || 'Unbekannt',
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

  loadJobDescriptionIntoWorkplace(item: JobDescription): void {
    const isCurrentlyExpanded = this.expandedItemId === item.id;

    // If not currently expanded and not readonly, acquire lock for workplace editing
    if (
      !isCurrentlyExpanded &&
      item.id &&
      !this.isItemLockedForCurrentUser(item)
    ) {
      this.lockService.acquireLock('JobDescription', item.id).subscribe({
        next: (success) => {
          if (success) {
            // Update local state to reflect lock acquisition
            item.lockedById = this.authService.getCurrentUser()?.id;
            item.lockedAt = new Date().toISOString();
          }
        },
        error: (err) =>
          console.error('Error acquiring lock for workplace:', err),
      });
    }

    this.currentWorkspaceService.triggerJobDescriptionFetch(item);
    this.currentWorkspaceService.setCurrentJobDescription(item);

    // Keep lock only if this is the currently expanded item
    this.onOverlayModalClosed({ keepLock: isCurrentlyExpanded });
  }

  onSearch(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    this.currentSearchRawValue = rawValue;
    this.updateHighlightedSearch(rawValue);
    this.searchSubject$.next(rawValue);
  }

  clearSearch(inputElement: HTMLInputElement): void {
    inputElement.value = '';
    this.currentSearchRawValue = '';
    this.highlightedSearchHtml = '';
    this.tooltipOverlayHtml = '';
    this.filter = {
      createdById: this.showOwnEntriesOnly
        ? this.authService.getCurrentUser()?.id
        : undefined,
    };
    this.loadJobDescriptions();
  }

  private updateHighlightedSearch(text: string): void {
    if (!text) {
      this.highlightedSearchHtml = '';
      this.tooltipOverlayHtml = '';
      return;
    }
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const matches: { start: number; end: number; text: string; valid: boolean; error?: string }[] = [];
    const regex = new RegExp(TOKEN_REGEX.source, TOKEN_REGEX.flags);
    let m;
    while ((m = regex.exec(escaped)) !== null) {
      const result = validateFilterToken(m[0], this.filterContext);
      matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], valid: result.valid, error: result.error });
    }

    let highlightedHtml = escaped;
    let tooltipHtml = escaped;
    for (let i = matches.length - 1; i >= 0; i--) {
      const { start, end, text: token, valid, error } = matches[i];
      if (valid) {
        highlightedHtml = highlightedHtml.slice(0, start) + `<span class="token-valid">${token}</span>` + highlightedHtml.slice(end);
        tooltipHtml = tooltipHtml.slice(0, start) + `<span>${token}</span>` + tooltipHtml.slice(end);
      } else {
        highlightedHtml = highlightedHtml.slice(0, start) + `<span class="token-invalid">${token}</span>` + highlightedHtml.slice(end);
        tooltipHtml = tooltipHtml.slice(0, start) + `<span style="pointer-events: auto; cursor: default;" data-filter-tooltip="${error}">${token}</span>` + tooltipHtml.slice(end);
      }
    }

    this.highlightedSearchHtml = this.sanitizer.bypassSecurityTrustHtml(highlightedHtml);
    this.tooltipOverlayHtml = this.sanitizer.bypassSecurityTrustHtml(tooltipHtml);
  }

  onSearchAreaMouseMove(event: MouseEvent): void {
    if (!this.tooltipOverlayRef) {
      this.filterTooltipVisible = false;
      return;
    }
    const overlayEl = this.tooltipOverlayRef.nativeElement;
    const spans = overlayEl.querySelectorAll('[data-filter-tooltip]');
    let found = false;
    for (let i = 0; i < spans.length; i++) {
      const rect = spans[i].getBoundingClientRect();
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        const tooltip = spans[i].getAttribute('data-filter-tooltip')!;
        this.filterTooltipText = tooltip;
        this.filterTooltipVisible = true;
        const parentRect = overlayEl.closest('.relative')!.getBoundingClientRect();
        this.filterTooltipLeft = rect.left - parentRect.left + rect.width / 2;
        found = true;
        break;
      }
    }
    if (!found) {
      this.filterTooltipVisible = false;
    }
  }

  onTooltipOverlayMouseLeave(): void {
    this.filterTooltipVisible = false;
  }

  toggleHelpPanel(event: Event): void {
    event.stopPropagation();
    this.isHelpPanelOpen = !this.isHelpPanelOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isHelpPanelOpen || !this.searchArea) return;
    if (!this.searchArea.nativeElement.contains(event.target as Node)) {
      this.isHelpPanelOpen = false;
    }
  }

  resetSearchInput(): void {
    this.filter = {};
    this.currentSearchRawValue = '';
    this.highlightedSearchHtml = '';
    this.tooltipOverlayHtml = '';
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
  }

  resetFiltersAndInput(): void {
    this.filter = {};
    this.showOwnEntriesOnly = false;
    this.currentSearchRawValue = '';
    this.highlightedSearchHtml = '';
    this.tooltipOverlayHtml = '';
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
    this.loadJobDescriptions();
  }

  onOverlayModalClosed(options: { keepLock?: boolean } = {}): void {
    const expandedItem = this.jobDescriptions.find(
      (jd) => jd.id === this.expandedItemId,
    );
    const isReadonly =
      expandedItem && this.isItemLockedForCurrentUser(expandedItem);

    if (expandedItem && expandedItem.id && !isReadonly) {
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
              error,
            );
          },
        });
    }

    // Release lock when overlay closes (unless keeping lock for workplace or readonly)
    if (this.expandedItemId && !options.keepLock) {
      const itemToRelease = this.jobDescriptions.find(
        (jd) => jd.id === this.expandedItemId,
      );

      if (!isReadonly) {
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
            error: (err) =>
              console.error('Error releasing lock on overlay close:', err),
          });
      }

      // Reset expanded state
      this.expandedItemId = null;
    }

    this.closeModal.emit();
  }
}
