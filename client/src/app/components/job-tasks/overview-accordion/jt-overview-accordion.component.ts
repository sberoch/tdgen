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
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  AngularEditorConfig,
  AngularEditorModule,
} from '@kolkov/angular-editor';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { CardService } from '../../../services/card.service';
import { CurrentWorkspaceService } from '../../../services/current-workspace.service';
import { AuthService } from '../../../services/auth.service';
import { LockService } from '../../../services/lock.service';
import { SseService } from '../../../services/sse.service';
import {
  JobTaskFilter,
  JobTasksService,
} from '../../../services/job-tasks.service';
import { JobDescription } from '../../../types/job-descriptions';
import { CreateJobTask, JobTask } from '../../../types/job-tasks';
import { Tag } from '../../../types/tag';
import { Card, getTruncatedPlainText } from '../../../utils/card.utils';
import { JobTaskDeleteConfirmationDialogComponent } from '../../job-task-delete-confirmation-dialog/job-task-delete-confirmation-dialog.component';
import { JobTaskPermanentDeleteDialogComponent } from '../../job-task-permanent-delete-dialog/job-task-permanent-delete-dialog.component';
import { JobTaskTitleDialogComponent } from '../job-task-title-dialog/job-task-title-dialog.component';
import { LockConflictDialogComponent } from '../../lock-conflict-dialog/lock-conflict-dialog.component';
import {
  validateFilterToken,
  extractFilters,
  TOKEN_REGEX,
  FilterContext,
} from '../../../columns/card-backlog-column/card-backlog-column.utils';
interface ExpandableJobTask extends JobTask {
  isNew?: boolean;
}

@Component({
  selector: 'app-jt-overview-accordion',
  templateUrl: './jt-overview-accordion.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    FormsModule,
    AngularEditorModule,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .search-backdrop {
        line-height: normal;
      }

      :host ::ng-deep .token-valid {
        background-color: #e0e0e0;
        font-style: italic;
        border-radius: 3px;
        box-shadow: 0 0 0 4px #e0e0e0;
      }

      :host ::ng-deep .token-invalid {
        background-color: #fecaca;
        color: #dc2626;
        font-style: italic;
        border-radius: 3px;
        box-shadow: 0 0 0 4px #fecaca;
      }

      :host ::ng-deep .token-remove-target {
        pointer-events: auto;
        position: relative;
      }

      :host ::ng-deep .token-remove-btn {
        display: none;
        position: absolute;
        right: -14px;
        top: -6px;
        width: 15px;
        height: 15px;
        line-height: 15px;
        text-align: center;
        font-size: 11px;
        font-style: normal;
        background: #9e9e9e;
        color: white;
        border-radius: 50%;
        cursor: pointer;
        z-index: 5;
      }

      :host ::ng-deep .token-remove-target:hover .token-remove-btn {
        display: block;
      }
    `,
  ],
})
export class JtOverviewAccordionComponent
  implements OnInit, OnDestroy, AfterViewChecked, OnChanges
{
  @Input() initialCard: Card | null = null;

  expandedItemId: number | null = null;
  tagInput: string = '';
  htmlContent: string = '';
  currentJobDescription: JobDescription | null = null;
  jobTasks: ExpandableJobTask[] = [];
  private subscription: Subscription = new Subscription();
  private loadJobTasksSubscription?: Subscription;
  filter: JobTaskFilter = {};
  showDeleted: boolean = false;
  showOwnEntriesOnly: boolean = false;
  ownEntriesCheckboxDisabled: boolean = false;
  newlyCreatedTitle: string | null = null;
  shouldScrollToNew: boolean = false;
  totalJobTasksCount: number = 0;
  filteredJobTasksCount: number = 0;
  editorConfig: AngularEditorConfig = {
    editable: true,
    sanitize: false,
    spellcheck: true,
    minHeight: '300px',
    toolbarHiddenButtons: [
      [
        'undo',
        'redo',
        'bold',
        'italic',
        'underline',
        'strikeThrough',
        'subscript',
        'superscript',
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        'justifyFull',
        'heading',
        'fontName',
      ],
      [
        'fontSize',
        'textColor',
        'backgroundColor',
        'customClasses',
        'link',
        'unlink',
        'insertImage',
        'insertVideo',
        'insertHorizontalRule',
        'removeFormat',
        'toggleEditorMode',
      ],
    ],
  };
  EG_OPTIONS = [
    'EG 1',
    'EG 2',
    'EG 3',
    'EG 4',
    'EG 5',
    'EG 6',
    'EG 7',
    'EG 8',
    'EG 9',
    'EG 10',
    'EG 11',
    'EG 12',
    'EG 13',
    'EG 14',
    'EG 15',
  ];

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
  private filterContext: FilterContext = 'jt';
  private searchSubject$ = new Subject<string>();
  private currentSearchRawValue: string = '';

  constructor(
    private dialog: MatDialog,
    private jobTasksService: JobTasksService,
    private cardService: CardService,
    private currentWorkspaceService: CurrentWorkspaceService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private lockService: LockService,
    private sseService: SseService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadJobTasks();
    this.currentWorkspaceService.currentJobDescription.subscribe(
      (jobDescription) => {
        this.currentJobDescription = jobDescription;
      },
    );

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

    // Subscribe to jobTasks$ observable for real-time updates
    this.subscription.add(
      this.jobTasksService.jobTasks$.subscribe((tasks) => {
        // Update local tasks array when service emits new data
        this.jobTasks = tasks.map((task) => ({
          ...task,
          isNew: false, // Don't mark as new on updates
        })) as ExpandableJobTask[];
        this.cdr.detectChanges(); // Force immediate change detection instead of markForCheck
      }),
    );

    // Debounced search
    this.subscription.add(
      this.searchSubject$.pipe(debounceTime(300)).subscribe((rawValue) => {
        const { filters, freeText } = extractFilters(rawValue, this.filterContext);
        // Disable "nur eigene Einträge" checkbox when createdBy/modifiedBy filter is active
        if (filters['createdById'] || filters['modifiedBy']) {
          this.ownEntriesCheckboxDisabled = true;
          this.showOwnEntriesOnly = false;
        } else {
          this.ownEntriesCheckboxDisabled = false;
        }
        // Merge structured filters with existing non-search filters
        const combinedFilter: JobTaskFilter = {
          includeDeleted: this.showDeleted || undefined,
          createdById: this.showOwnEntriesOnly
            ? this.authService.getCurrentUser()?.id
            : undefined,
          search: freeText || undefined,
          ...filters,
        };
        this.filter = combinedFilter;
        this.loadJobTasks();
      }),
    );
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToNew) {
      this.scrollToNewItem();
      this.shouldScrollToNew = false;
    }
  }

  scrollToNewItem() {
    const newItemIndex = this.jobTasks.findIndex((jt) => jt.isNew);

    if (newItemIndex >= 0 && this.accordionItems.length > newItemIndex) {
      // Wait for accordion animation (200ms) + extra time for Angular editor to render
      setTimeout(() => {
        const newItemElement =
          this.accordionItems.toArray()[newItemIndex].nativeElement;
        const scrollContainer = this.scrollContainer.nativeElement;

        // Calculate the position relative to the scroll container
        const containerRect = scrollContainer.getBoundingClientRect();
        const itemRect = newItemElement.getBoundingClientRect();

        // Get the current scroll position
        const currentScrollTop = scrollContainer.scrollTop;

        // Calculate the new scroll position (item position relative to container + current scroll)
        const newScrollTop =
          currentScrollTop + (itemRect.top - containerRect.top) - 50;

        // Smooth scroll to the new position
        scrollContainer.scrollTo({
          top: newScrollTop,
          behavior: 'smooth',
        });
      }, 200); // 200ms for animation + 200ms buffer for editor
    }
  }

  ngOnDestroy(): void {
    // Release lock if currently holding one
    if (this.expandedItemId) {
      this.lockService.releaseLock('JobTask', this.expandedItemId).subscribe();
    }
    if (this.loadJobTasksSubscription) {
      this.loadJobTasksSubscription.unsubscribe();
    }
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialCard'] && changes['initialCard'].currentValue) {
      this.loadJobTasks();
    }
  }

  loadJobTasks(): void {
    if (this.loadJobTasksSubscription) {
      this.loadJobTasksSubscription.unsubscribe();
    }

    this.loadJobTasksSubscription = this.jobTasksService
      .getJobTasks(this.filter)
      .subscribe({
        next: (jobTasksListResponse) => {
          this.totalJobTasksCount = jobTasksListResponse.totalCount;
          this.filteredJobTasksCount = jobTasksListResponse.tasks.length;
          this.jobTasks = jobTasksListResponse.tasks.map((task) => ({
            ...task,
            isNew:
              (this.newlyCreatedTitle !== null &&
                task.title === this.newlyCreatedTitle) ||
              (this.initialCard !== null &&
                task.title === this.initialCard.title),
          }));

          // If there's a newly created item or initial card, flag for scrolling and auto-expand it
          if (this.newlyCreatedTitle !== null || this.initialCard !== null) {
            this.shouldScrollToNew = true;

            // Find the item to auto-expand
            const targetTitle =
              this.initialCard?.title || this.newlyCreatedTitle;
            const targetItem = this.jobTasks.find(
              (jt) => jt.title === targetTitle,
            );

            if (targetItem && targetItem.id) {
              this.expandAndAcquireLock(targetItem.id);
            }

            // Remove the "new" flag after 3 seconds
            setTimeout(() => {
              this.newlyCreatedTitle = null;
              let changed = false;
              this.jobTasks.forEach((jt) => {
                if (jt.isNew) {
                  jt.isNew = false;
                  changed = true;
                }
              });
              if (changed) {
                this.cdr.markForCheck();
              }
            }, 3000);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading job tasks:', error);
        },
      });
  }

  applyFilter(newFilter: Partial<JobTaskFilter>): void {
    this.filter = { ...this.filter, ...newFilter };
    this.loadJobTasks();
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
    this.loadJobTasks();
  }

  clearInput(inputElement: HTMLInputElement) {
    inputElement.value = '';
  }

  onEgSelected(selectedEg: string, item: JobTask): void {
    if (!item.metadata) item.metadata = {};
    item.metadata['paymentGroup'] = selectedEg;

    this.jobTasksService
      .updateJobTask(item.id!, {
        metadata: item.metadata,
      })
      .subscribe({
        next: (updatedTaskFromServer) => {
          this._handleSuccessfulUpdate({ updatedTaskFromServer });
        },
        error: (error) => {
          console.error('Error updating payment group:', error);
        },
      });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(JobTaskTitleDialogComponent, {
      width: '600px',
      data: {
        isEditing: false,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.newlyCreatedTitle = result;
        this.loadJobTasks();
        this.cardService.initializeCards();
        if (this.currentJobDescription) {
          this.currentWorkspaceService.triggerJobDescriptionFetch(
            this.currentJobDescription,
          );
        }
      }
    });
  }

  openEditDialog(item: JobTask, event: Event) {
    event.stopPropagation();

    // Acquire lock before opening edit dialog
    this.lockService.acquireLock('JobTask', item.id!).subscribe({
      next: (success) => {
        if (success) {
          // Update local lock status
          const currentUser = this.authService.getCurrentUser();
          item.lockedById = currentUser?.id;
          item.lockedAt = new Date().toISOString();

          const dialogRef = this.dialog.open(JobTaskTitleDialogComponent, {
            width: '600px',
            data: {
              title: item.title,
              id: item.id,
              isEditing: true,
            },
          });

          dialogRef.afterClosed().subscribe((result) => {
            // Release lock after dialog closes
            this.lockService.releaseLock('JobTask', item.id!).subscribe({
              next: () => {
                // Update local state to reflect lock release
                item.lockedById = undefined;
                item.lockedAt = undefined;
                item.lockExpiry = undefined;
                this.cdr.markForCheck();
              },
              error: (err) =>
                console.error('Error releasing lock after title edit:', err),
            });

            if (result) {
              this.newlyCreatedTitle = result;
              this.loadJobTasks();
              this.cardService.initializeCards();
              if (this.currentJobDescription) {
                this.currentWorkspaceService.triggerJobDescriptionFetch(
                  this.currentJobDescription,
                );
              }
            }
          });
        } else {
          // Lock acquisition failed - show conflict dialog
          this.dialog.open(LockConflictDialogComponent, {
            width: '500px',
            data: {
              lockedById: item.lockedById || 'Unbekannt',
              entityType: 'JobTask',
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
    const previousExpandedItemId = this.expandedItemId;
    const currentUser = this.authService.getCurrentUser();
    const itemToToggle = this.jobTasks.find((jt) => jt.id === id);

    // Prevent toggling if locked by another user
    if (
      itemToToggle?.lockedById &&
      itemToToggle.lockedById !== currentUser?.id
    ) {
      return; // Do nothing, row should appear disabled
    }

    // Save pending changes for the item being collapsed
    if (previousExpandedItemId) {
      const previouslyExpandedItem = this.jobTasks.find(
        (jt) => jt.id === previousExpandedItemId,
      );
      if (previouslyExpandedItem && previouslyExpandedItem.id) {
        const payloadToSave: Partial<JobTask> = {};
        if (previouslyExpandedItem.text !== this.htmlContent) {
          payloadToSave.text = this.htmlContent;
        }

        if (Object.keys(payloadToSave).length > 0) {
          this.jobTasksService
            .updateJobTask(
              previouslyExpandedItem.id!,
              payloadToSave as Partial<CreateJobTask>,
            )
            .subscribe({
              next: (taskFromServer) => {
                this._handleSuccessfulUpdate({
                  updatedTaskFromServer: taskFromServer,
                });
              },
              error: (err) =>
                console.error(
                  'Error updating job task from toggleAccordion:',
                  err,
                ),
            });
        }

        // Release lock when collapsing
        this.lockService
          .releaseLock('JobTask', previousExpandedItemId)
          .subscribe({
            next: () => {
              // Update local state to reflect lock release
              if (previouslyExpandedItem) {
                previouslyExpandedItem.lockedById = undefined;
                previouslyExpandedItem.lockedAt = undefined;
                previouslyExpandedItem.lockExpiry = undefined;
                this.cdr.markForCheck();
              }
            },
            error: (err) => console.error('Error releasing lock:', err),
          });
      }
    }

    // Toggle expansion state
    if (this.expandedItemId === id) {
      // Collapsing
      this.expandedItemId = null;
      this.htmlContent = '';
      this.cdr.markForCheck();
    } else {
      this.expandAndAcquireLock(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedItemId === id;
  }

  getAccordionState(id: number): string {
    return this.isExpanded(id) ? 'expanded' : 'collapsed';
  }

  isLockedByOtherUser(item: JobTask): boolean {
    const currentUser = this.authService.getCurrentUser();
    return !!item.lockedById && item.lockedById !== currentUser?.id;
  }

  isItemLockedForCurrentUser(item: JobTask): boolean {
    return !!item.isLockedForUsers && !this.isAdmin();
  }

  getJobDescriptionCountDisplay(item: JobTask): string {
    const count = item.jobDescriptions?.length || 0;

    if (count === 1) {
      return 'In einer Tätigkeitsdarstellung enthalten.';
    } else {
      return `In ${count} Tätigkeitsdarstellungen enthalten.`;
    }
  }

  addTags(item: JobTask): void {
    if (!this.tagInput.trim()) return;

    const newTagNames = this.tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    // Avoid adding duplicates based on current local tags
    const existingTagNamesSet = new Set(
      item.tags?.map((tag) => tag.name) || [],
    );
    const uniqueNewTagNames = newTagNames.filter(
      (name) => !existingTagNamesSet.has(name),
    );

    if (uniqueNewTagNames.length === 0) {
      this.tagInput = ''; // Clear input even if no new tags were added
      return;
    }

    // Optimistically update local tags for UI responsiveness
    const currentTags = item.tags ? [...item.tags] : [];
    uniqueNewTagNames.forEach((name) =>
      currentTags.push({ id: Math.random(), name } as Tag),
    ); // Add with temp id
    item.tags = currentTags;

    const tagNamesToSave = item.tags.map((tag) => tag.name);
    this.tagInput = ''; // Clear input after processing

    this.jobTasksService
      .updateJobTask(item.id!, {
        tags: tagNamesToSave,
      })
      .subscribe({
        next: (updatedTaskFromServer) => {
          // reloadTasks true because tags can affect filtering/grouping elsewhere
          this._handleSuccessfulUpdate({
            updatedTaskFromServer,
            reloadTasks: true,
          });
        },
        error: (err) => {
          console.error('Error updating tags:', err);
          // Potentially revert optimistic update here
          // For now, error is logged.
        },
      });
  }

  removeTag(item: JobTask, tagToRemove: Tag): void {
    if (!item.tags) return;
    item.tags = item.tags.filter((tag) => tag.name !== tagToRemove.name);

    // Optimistically updated locally, now save to backend
    this.jobTasksService
      .updateJobTask(item.id!, {
        tags: item.tags.map((tag) => tag.name),
      })
      .subscribe({
        next: (updatedTaskFromServer) => {
          // reloadTasks true because tags can affect filtering/grouping elsewhere
          this._handleSuccessfulUpdate({
            updatedTaskFromServer,
            reloadTasks: true,
          });
        },
        error: (err) => {
          console.error('Error removing tag:', err);
          // Potentially revert optimistic update here
        },
      });
  }

  handleKeyPress(event: KeyboardEvent, item: JobTask): void {
    if (event.key === 'Enter') {
      this.addTags(item);
    }
  }

  deleteItem(item: JobTask): void {
    // Acquire lock before deleting
    this.lockService.acquireLock('JobTask', item.id!).subscribe({
      next: (success) => {
        if (success) {
          // Update local lock status
          const currentUser = this.authService.getCurrentUser();
          item.lockedById = currentUser?.id;
          item.lockedAt = new Date().toISOString();

          this.jobTasksService
            .getAffectedJobDescriptionsCount(item.id!)
            .subscribe({
              next: (affectedCount) => {
                const dialogRef = this.dialog.open(
                  JobTaskDeleteConfirmationDialogComponent,
                  {
                    width: '500px',
                    data: {
                      jobTask: item,
                      affectedCount: affectedCount,
                      onConfirmCallback: () => {
                        this.jobTasksService.deleteJobTask(item.id!).subscribe({
                          next: () => {
                            // Release lock after successful deletion
                            this.lockService
                              .releaseLock('JobTask', item.id!)
                              .subscribe({
                                next: () => {
                                  item.lockedById = undefined;
                                  item.lockedAt = undefined;
                                  item.lockExpiry = undefined;
                                  this.cdr.markForCheck();
                                },
                                error: (err) =>
                                  console.error(
                                    'Error releasing lock after delete:',
                                    err,
                                  ),
                              });
                            this._handleSuccessfulUpdate({ reloadTasks: true });
                          },
                          error: (error) => {
                            console.error('Error deleting job task:', error);
                            // Release lock on error
                            this.lockService
                              .releaseLock('JobTask', item.id!)
                              .subscribe();
                          },
                        });
                      },
                    },
                  },
                );

                dialogRef.afterClosed().subscribe((confirmed) => {
                  // Release lock if user cancelled
                  if (!confirmed) {
                    this.lockService
                      .releaseLock('JobTask', item.id!)
                      .subscribe({
                        next: () => {
                          item.lockedById = undefined;
                          item.lockedAt = undefined;
                          item.lockExpiry = undefined;
                          this.cdr.markForCheck();
                        },
                        error: (err) =>
                          console.error(
                            'Error releasing lock after cancel:',
                            err,
                          ),
                      });
                  }
                });
              },
              error: (error) => {
                console.error(
                  'Error fetching affected job descriptions count:',
                  error,
                );
                // Release lock on error
                this.lockService.releaseLock('JobTask', item.id!).subscribe();
              },
            });
        } else {
          // Lock acquisition failed - show conflict dialog
          this.dialog.open(LockConflictDialogComponent, {
            width: '500px',
            data: {
              lockedById: item.lockedById || 'Unbekannt',
              entityType: 'JobTask',
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

  toggleLockForUsers(item: JobTask, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isLocked = checkbox.checked;

    this.jobTasksService
      .updateJobTask(item.id, { isLockedForUsers: isLocked })
      .subscribe({
        next: (updatedTask) => {
          const index = this.jobTasks.findIndex((jt) => jt.id === item.id);
          if (index !== -1) {
            this.jobTasks[index] = {
              ...this.jobTasks[index],
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

  softDeleteItem(item: JobTask): void {
    // softDeleteItem delegates to deleteItem, which now handles lock acquisition
    this.deleteItem(item);
  }

  permanentDeleteItemWithCleanup(item: JobTask): void {
    // Acquire lock before permanent deletion
    this.lockService.acquireLock('JobTask', item.id!).subscribe({
      next: (success) => {
        if (success) {
          // Update local lock status
          const currentUser = this.authService.getCurrentUser();
          item.lockedById = currentUser?.id;
          item.lockedAt = new Date().toISOString();

          this.jobTasksService
            .getAffectedJobDescriptionsCount(item.id!)
            .subscribe({
              next: (affectedCount) => {
                const dialogRef = this.dialog.open(
                  JobTaskPermanentDeleteDialogComponent,
                  {
                    width: '500px',
                    data: {
                      jobTask: item,
                      affectedCount: affectedCount,
                      onConfirmCallback: () => {
                        this.jobTasksService
                          .permanentDeleteJobTaskWithCleanup(item.id!)
                          .subscribe({
                            next: () => {
                              // Release lock after successful deletion
                              this.lockService
                                .releaseLock('JobTask', item.id!)
                                .subscribe({
                                  next: () => {
                                    item.lockedById = undefined;
                                    item.lockedAt = undefined;
                                    item.lockExpiry = undefined;
                                    this.cdr.markForCheck();
                                  },
                                  error: (err) =>
                                    console.error(
                                      'Error releasing lock after permanent delete:',
                                      err,
                                    ),
                                });
                              this._handleSuccessfulUpdate({
                                reloadTasks: true,
                              });
                            },
                            error: (error) => {
                              console.error(
                                'Error permanently deleting job task with cleanup:',
                                error,
                              );
                              // Release lock on error
                              this.lockService
                                .releaseLock('JobTask', item.id!)
                                .subscribe();
                            },
                          });
                      },
                    },
                  },
                );

                dialogRef.afterClosed().subscribe((confirmed) => {
                  // Release lock if user cancelled
                  if (!confirmed) {
                    this.lockService
                      .releaseLock('JobTask', item.id!)
                      .subscribe({
                        next: () => {
                          item.lockedById = undefined;
                          item.lockedAt = undefined;
                          item.lockExpiry = undefined;
                          this.cdr.markForCheck();
                        },
                        error: (err) =>
                          console.error(
                            'Error releasing lock after cancel:',
                            err,
                          ),
                      });
                  }
                });
              },
              error: (error) => {
                console.error(
                  'Error fetching affected job descriptions count:',
                  error,
                );
                // Release lock on error
                this.lockService.releaseLock('JobTask', item.id!).subscribe();
              },
            });
        } else {
          // Lock acquisition failed - show conflict dialog
          this.dialog.open(LockConflictDialogComponent, {
            width: '500px',
            data: {
              lockedById: item.lockedById || 'Unbekannt',
              entityType: 'JobTask',
            },
          });
        }
      },
      error: (err) => {
        console.error('Error acquiring lock for permanent delete:', err);
      },
    });
  }

  restoreItem(item: JobTask): void {
    // Acquire lock before restoring
    this.lockService.acquireLock('JobTask', item.id!).subscribe({
      next: (success) => {
        if (success) {
          // Update local lock status
          const currentUser = this.authService.getCurrentUser();
          item.lockedById = currentUser?.id;
          item.lockedAt = new Date().toISOString();

          this.jobTasksService.restoreJobTask(item.id!).subscribe({
            next: () => {
              // Release lock after successful restore
              this.lockService.releaseLock('JobTask', item.id!).subscribe({
                next: () => {
                  item.lockedById = undefined;
                  item.lockedAt = undefined;
                  item.lockExpiry = undefined;
                  this.cdr.markForCheck();
                },
                error: (err) =>
                  console.error('Error releasing lock after restore:', err),
              });
              this._handleSuccessfulUpdate({ reloadTasks: true });
            },
            error: (error) => {
              console.error('Error restoring job task:', error);
              // Release lock on error
              this.lockService.releaseLock('JobTask', item.id!).subscribe();
            },
          });
        } else {
          // Lock acquisition failed - show conflict dialog
          this.dialog.open(LockConflictDialogComponent, {
            width: '500px',
            data: {
              lockedById: item.lockedById || 'Unbekannt',
              entityType: 'JobTask',
            },
          });
        }
      },
      error: (err) => {
        console.error('Error acquiring lock for restore:', err);
      },
    });
  }

  breakLock(item: JobTask): void {
    this.lockService.breakLock('JobTask', item.id!).subscribe({
      next: (response) => {
        // Update local state to clear lock fields
        item.lockedById = undefined;
        item.lockedAt = undefined;
        item.lockExpiry = undefined;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error breaking lock:', err),
    });
  }

  private expandAndAcquireLock(taskId: number): void {
    const currentUser = this.authService.getCurrentUser();
    const itemToExpand = this.jobTasks.find((jt) => jt.id === taskId);

    this.lockService.acquireLock('JobTask', taskId).subscribe({
      next: (success) => {
        if (success) {
          this.expandedItemId = taskId;
          this.htmlContent = '';
          this.jobTasksService.getJobTaskById(taskId).subscribe({
            next: (task) => {
              this.htmlContent = task.text || '';
              const currentItem = this.jobTasks.find((jt) => jt.id === taskId);
              if (currentItem) {
                currentItem.text = task.text;
                currentItem.lockedById = currentUser?.id;
                currentItem.lockedAt = new Date().toISOString();
              }
              this.cdr.markForCheck();
            },
            error: (error) => {
              console.error('Error loading task content:', error);
              this.htmlContent = '';
              this.cdr.markForCheck();
            },
          });
        } else {
          this.dialog.open(LockConflictDialogComponent, {
            width: '500px',
            data: {
              lockedById: itemToExpand?.lockedById || 'Unbekannt',
              entityType: 'JobTask',
            },
          });
        }
      },
      error: (err) => {
        console.error('Error acquiring lock:', err);
      },
    });
  }

  trackById(index: number, item: JobTask): number {
    return item.id!;
  }

  getEditorConfig(item: JobTask): AngularEditorConfig {
    return {
      ...this.editorConfig,
      editable: !item.deletedAt && !this.isItemLockedForCurrentUser(item),
    };
  }

  onEditorBlur(): void {
    if (this.expandedItemId) {
      const expandedItem = this.jobTasks.find(
        (jt) => jt.id === this.expandedItemId,
      );
      if (expandedItem && expandedItem.id) {
        if (expandedItem.text !== this.htmlContent) {
          this.jobTasksService
            .updateJobTask(expandedItem.id, {
              text: this.htmlContent,
            })
            .subscribe({
              next: (updatedTaskFromServer) => {
                this._handleSuccessfulUpdate({ updatedTaskFromServer });
              },
              error: (err) =>
                console.error('Error updating job task text on blur:', err),
            });
        }
      }
    }
  }

  onSearch(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    this.currentSearchRawValue = rawValue;
    this.updateHighlightedSearch(rawValue);
    this.searchSubject$.next(rawValue);
  }

  onTooltipOverlayClick(event: MouseEvent, inputElement: HTMLInputElement): void {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('token-remove-btn')) return;
    const tokenSpan = target.closest('[data-filter-token]');
    if (!tokenSpan) return;
    const token = tokenSpan.getAttribute('data-filter-token')!;
    this.removeFilterToken(token, inputElement);
  }

  private removeFilterToken(token: string, inputElement: HTMLInputElement): void {
    const raw = inputElement.value;
    const newValue = raw.replace(token, '').replace(/\s{2,}/g, ' ').trim();
    inputElement.value = newValue;
    this.currentSearchRawValue = newValue;
    this.updateHighlightedSearch(newValue);
    this.searchSubject$.next(newValue);
  }

  clearSearch(inputElement: HTMLInputElement): void {
    inputElement.value = '';
    this.currentSearchRawValue = '';
    this.highlightedSearchHtml = '';
    this.tooltipOverlayHtml = '';
    this.ownEntriesCheckboxDisabled = false;
    this.filter = {
      includeDeleted: this.showDeleted || undefined,
      createdById: this.showOwnEntriesOnly
        ? this.authService.getCurrentUser()?.id
        : undefined,
    };
    this.loadJobTasks();
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
        tooltipHtml = tooltipHtml.slice(0, start) + `<span class="token-remove-target" data-filter-token="${token}">${token}<span class="token-remove-btn">\u00d7</span></span>` + tooltipHtml.slice(end);
      } else {
        highlightedHtml = highlightedHtml.slice(0, start) + `<span class="token-invalid">${token}</span>` + highlightedHtml.slice(end);
        tooltipHtml = tooltipHtml.slice(0, start) + `<span class="token-remove-target" data-filter-tooltip="${error}" data-filter-token="${token}" style="cursor: default;">${token}<span class="token-remove-btn">\u00d7</span></span>` + tooltipHtml.slice(end);
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
    this.showDeleted = false;
    this.showOwnEntriesOnly = false;
    this.currentSearchRawValue = '';
    this.highlightedSearchHtml = '';
    this.tooltipOverlayHtml = '';
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
    this.loadJobTasks();
  }

  onOverlayModalClosed(): void {
    const expandedItem = this.jobTasks.find(
      (jt) => jt.id === this.expandedItemId,
    );

    if (expandedItem && expandedItem.id) {
      const payload: Partial<CreateJobTask> = {};
      let needsSave = false;

      // 1. Process any pending tagInput
      if (this.tagInput.trim()) {
        const newTagNames = this.tagInput
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag);

        const currentTags = expandedItem.tags ? [...expandedItem.tags] : [];
        const existingTagNamesSet = new Set(currentTags.map((t) => t.name));
        const uniqueNewTags = newTagNames.filter(
          (name) => !existingTagNamesSet.has(name),
        );

        if (uniqueNewTags.length > 0) {
          uniqueNewTags.forEach((name) =>
            currentTags.push({ id: Math.random(), name } as Tag),
          );
          expandedItem.tags = currentTags; // Update local item's tags
          payload.tags = expandedItem.tags.map((t) => t.name); // This is now string[]
          needsSave = true;
        }
        this.tagInput = ''; // Clear input
      }

      // 2. Check if htmlContent (WYSIWYG editor text) has changed
      const currentText = expandedItem.text || '';
      const editorText = this.htmlContent || '';
      if (currentText !== editorText) {
        payload.text = this.htmlContent;
        expandedItem.text = this.htmlContent; // Update local copy
        needsSave = true;
      }

      // 3. Handle metadata if necessary, ensuring correct type for CreateJobTask
      // Example: if expandedItem.metadata could be assigned and is compatible or mapped
      // if (expandedItem.metadata /* && check if changed or always send */) {
      //   payload.metadata = mapMetadataToCreateCompatibleType(expandedItem.metadata);
      //   needsSave = true;
      // }

      if (needsSave) {
        this.jobTasksService
          .updateJobTask(expandedItem.id!, payload)
          .subscribe({
            next: (taskFromServer) => {
              // If tags were part of payload, taskFromServer should have them.
              // If only text was, then taskFromServer updates text.
              // reloadTasks might be needed if tags changed here and they affect global state/filters.
              // For now, assume onOverlayModalClosed primarily finalizes editor state.
              this._handleSuccessfulUpdate({
                updatedTaskFromServer: taskFromServer,
                reloadTasks: !!payload.tags,
              });
            },
            error: (err) =>
              console.error(
                'Error updating job task from onOverlayModalClosed:',
                err,
              ),
          });
      }
    }

    // Release lock when overlay closes
    if (this.expandedItemId) {
      const itemToRelease = this.jobTasks.find(
        (jt) => jt.id === this.expandedItemId,
      );

      this.lockService.releaseLock('JobTask', this.expandedItemId).subscribe({
        next: () => {
          if (itemToRelease) {
            itemToRelease.lockedById = undefined;
            itemToRelease.lockedAt = undefined;
            itemToRelease.lockExpiry = undefined;
            this.cdr.markForCheck();
          }
        },
        error: (err) =>
          console.error('Error releasing lock on overlay close:', err),
      });
      this.expandedItemId = null;
    }
  }

  private _handleSuccessfulUpdate(
    options: { reloadTasks?: boolean; updatedTaskFromServer?: JobTask } = {},
  ): void {
    if (options.updatedTaskFromServer) {
      const localTask = this.jobTasks.find(
        (jt) => jt.id === options.updatedTaskFromServer!.id,
      );
      if (localTask) {
        // Preserve 'isNew' if it was set locally and not part of server response,
        // though loadJobTasks usually recalculates it.
        const isNewState = localTask.isNew;
        Object.assign(localTask, options.updatedTaskFromServer);
        if (
          isNewState !== undefined &&
          (options.updatedTaskFromServer as ExpandableJobTask).isNew ===
            undefined
        ) {
          localTask.isNew = isNewState;
        }
      }
    }

    if (options.reloadTasks) {
      this.loadJobTasks();
    }

    this.cardService.initializeCards();
    if (this.currentJobDescription) {
      this.currentWorkspaceService.triggerJobDescriptionFetch(
        this.currentJobDescription,
      );
    }
    this.cdr.markForCheck();
  }
}
