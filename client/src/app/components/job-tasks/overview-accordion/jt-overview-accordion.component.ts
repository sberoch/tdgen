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
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  AngularEditorConfig,
  AngularEditorModule,
} from '@kolkov/angular-editor';
import { Subscription } from 'rxjs';
import { CardService } from '../../../services/card.service';
import { CurrentWorkspaceService } from '../../../services/current-workspace.service';
import { AuthService } from '../../../services/auth.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  filter: JobTaskFilter = {};
  showDeleted: boolean = false;
  showOwnEntriesOnly: boolean = false;
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
        'indent',
        'outdent',
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
  @Output() closeModal = new EventEmitter<void>();

  constructor(
    private dialog: MatDialog,
    private jobTasksService: JobTasksService,
    private cardService: CardService,
    private currentWorkspaceService: CurrentWorkspaceService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadJobTasks();
    this.currentWorkspaceService.currentJobDescription.subscribe(
      (jobDescription) => {
        this.currentJobDescription = jobDescription;
      }
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
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialCard'] && changes['initialCard'].currentValue) {
      this.loadJobTasks();
    }
  }

  loadJobTasks(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = new Subscription();
    }

    this.subscription.add(
      this.jobTasksService.getJobTasks(this.filter).subscribe({
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
              (jt) => jt.title === targetTitle
            );

            if (targetItem && targetItem.id) {
              this.expandedItemId = targetItem.id;

              // Load content for the expanded item
              this.jobTasksService.getJobTaskById(targetItem.id).subscribe({
                next: (task) => {
                  this.htmlContent = task.text || '';
                },
                error: (error) => {
                  console.error('Error loading task content:', error);
                  this.htmlContent = '';
                },
              });
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
      })
    );
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
            this.currentJobDescription
          );
        }
      }
    });
  }

  openEditDialog(item: JobTask, event: Event) {
    event.stopPropagation();

    const dialogRef = this.dialog.open(JobTaskTitleDialogComponent, {
      width: '600px',
      data: {
        title: item.title,
        id: item.id,
        isEditing: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.newlyCreatedTitle = result;
        this.loadJobTasks();
        this.cardService.initializeCards();
        if (this.currentJobDescription) {
          this.currentWorkspaceService.triggerJobDescriptionFetch(
            this.currentJobDescription
          );
        }
      }
    });
  }

  truncate(text: string, maxLength: number): string {
    return getTruncatedPlainText(text, maxLength);
  }

  toggleAccordion(id: number): void {
    const previousExpandedItemId = this.expandedItemId;

    // Save pending changes for the item being collapsed
    if (previousExpandedItemId) {
      const previouslyExpandedItem = this.jobTasks.find(
        (jt) => jt.id === previousExpandedItemId
      );
      if (previouslyExpandedItem && previouslyExpandedItem.id) {
        const payloadToSave: Partial<JobTask> = {};
        if (previouslyExpandedItem.text !== this.htmlContent) {
          payloadToSave.text = this.htmlContent;
        }
        // Include metadata if it can be changed directly in the editor view and needs saving.
        // For now, assuming only text changes via htmlContent directly.
        // payloadToSave.metadata = previouslyExpandedItem.metadata;

        if (Object.keys(payloadToSave).length > 0) {
          this.jobTasksService
            .updateJobTask(
              previouslyExpandedItem.id!,
              payloadToSave as Partial<CreateJobTask>
            )
            .subscribe({
              next: (taskFromServer) => {
                // Update local item that was just collapsed
                this._handleSuccessfulUpdate({
                  updatedTaskFromServer: taskFromServer,
                });
              },
              error: (err) =>
                console.error(
                  'Error updating job task from toggleAccordion:',
                  err
                ),
            });
        }
      }
    }

    // Toggle expansion state
    if (this.expandedItemId === id) {
      this.expandedItemId = null;
      this.htmlContent = ''; // Clear content when collapsing
      this.cdr.markForCheck();
    } else {
      this.expandedItemId = id;
      this.htmlContent = ''; // Clear previous content before loading new
      this.jobTasksService.getJobTaskById(id).subscribe({
        next: (task) => {
          this.htmlContent = task.text || '';
          // Optionally update the local task item if getJobTaskById returns more details
          const currentItem = this.jobTasks.find((jt) => jt.id === id);
          if (currentItem) {
            currentItem.text = task.text; // Ensure local copy is also up-to-date
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading task content:', error);
          this.htmlContent = '';
          this.cdr.markForCheck();
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

  addTags(item: JobTask): void {
    if (!this.tagInput.trim()) return;

    const newTagNames = this.tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    // Avoid adding duplicates based on current local tags
    const existingTagNamesSet = new Set(
      item.tags?.map((tag) => tag.name) || []
    );
    const uniqueNewTagNames = newTagNames.filter(
      (name) => !existingTagNamesSet.has(name)
    );

    if (uniqueNewTagNames.length === 0) {
      this.tagInput = ''; // Clear input even if no new tags were added
      return;
    }

    // Optimistically update local tags for UI responsiveness
    const currentTags = item.tags ? [...item.tags] : [];
    uniqueNewTagNames.forEach((name) =>
      currentTags.push({ id: Math.random(), name } as Tag)
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
    this.jobTasksService.getAffectedJobDescriptionsCount(item.id!).subscribe({
      next: (affectedCount) => {
        this.dialog.open(JobTaskDeleteConfirmationDialogComponent, {
          width: '500px',
          data: {
            jobTask: item,
            affectedCount: affectedCount,
            onConfirmCallback: () => {
              this.jobTasksService.deleteJobTask(item.id!).subscribe({
                next: () => {
                  this._handleSuccessfulUpdate({ reloadTasks: true });
                },
                error: (error) => {
                  console.error('Error deleting job task:', error);
                },
              });
            },
          },
        });
      },
      error: (error) => {
        console.error('Error fetching affected job descriptions count:', error);
      },
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  softDeleteItem(item: JobTask): void {
    this.deleteItem(item);
  }

  permanentDeleteItemWithCleanup(item: JobTask): void {
    this.jobTasksService.getAffectedJobDescriptionsCount(item.id!).subscribe({
      next: (affectedCount) => {
        this.dialog.open(JobTaskPermanentDeleteDialogComponent, {
          width: '500px',
          data: {
            jobTask: item,
            affectedCount: affectedCount,
            onConfirmCallback: () => {
              this.jobTasksService.permanentDeleteJobTaskWithCleanup(item.id!).subscribe({
                next: () => {
                  this._handleSuccessfulUpdate({ reloadTasks: true });
                },
                error: (error) => {
                  console.error('Error permanently deleting job task with cleanup:', error);
                },
              });
            },
          },
        });
      },
      error: (error) => {
        console.error('Error fetching affected job descriptions count:', error);
      },
    });
  }

  restoreItem(item: JobTask): void {
    this.jobTasksService.restoreJobTask(item.id!).subscribe({
      next: () => {
        this._handleSuccessfulUpdate({ reloadTasks: true });
      },
      error: (error) => {
        console.error('Error restoring job task:', error);
      },
    });
  }

  trackById(index: number, item: JobTask): number {
    return item.id!;
  }

  getEditorConfig(item: JobTask): AngularEditorConfig {
    return {
      ...this.editorConfig,
      editable: !item.deletedAt,
    };
  }

  onEditorBlur(): void {
    if (this.expandedItemId) {
      const expandedItem = this.jobTasks.find(
        (jt) => jt.id === this.expandedItemId
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

  resetSearchInput(): void {
    this.filter = {};
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
  }

  resetFiltersAndInput(): void {
    this.filter = {};
    this.showDeleted = false;
    this.showOwnEntriesOnly = false;
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
    this.loadJobTasks();
  }

  onOverlayModalClosed(): void {
    const expandedItem = this.jobTasks.find(
      (jt) => jt.id === this.expandedItemId
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
          (name) => !existingTagNamesSet.has(name)
        );

        if (uniqueNewTags.length > 0) {
          uniqueNewTags.forEach((name) =>
            currentTags.push({ id: Math.random(), name } as Tag)
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
                err
              ),
          });
      }
    }
  }

  private _handleSuccessfulUpdate(
    options: { reloadTasks?: boolean; updatedTaskFromServer?: JobTask } = {}
  ): void {
    if (options.updatedTaskFromServer) {
      const localTask = this.jobTasks.find(
        (jt) => jt.id === options.updatedTaskFromServer!.id
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
        this.currentJobDescription
      );
    }
    this.cdr.markForCheck();
  }
}
