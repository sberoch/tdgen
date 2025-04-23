import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewChecked,
  Input,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { truncateText } from '../../../utils/card.utils';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog-component';
import { MatDialog } from '@angular/material/dialog';
import {
  JobTasksService,
  JobTaskFilter,
} from '../../../services/job-tasks.service';
import { JobTask } from '../../../types/job-tasks';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { JobTaskTitleDialogComponent } from '../job-task-title-dialog/job-task-title-dialog.component';
import { Card } from '../../../utils/card.utils';
import { Tag } from '../../../types/tag';
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
})
export class JtOverviewAccordionComponent
  implements OnInit, OnDestroy, AfterViewChecked, OnChanges
{
  @Input() initialCard: Card | null = null;

  expandedItemId: number | null = null;
  tagInput: string = '';
  htmlContent: string = '';
  jobTasks: ExpandableJobTask[] = [];
  private subscription: Subscription = new Subscription();
  filter: JobTaskFilter = {};
  showDeleted: boolean = false;
  newlyCreatedTitle: string | null = null;
  shouldScrollToNew: boolean = false;
  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    minHeight: '300px',
    toolbarHiddenButtons: [
      ['subscript', 'superscript'],
      ['insertImage', 'insertVideo'],
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
  @Output() closeModal = new EventEmitter<void>();

  constructor(
    private dialog: MatDialog,
    private jobTasksService: JobTasksService
  ) {}

  ngOnInit(): void {
    this.loadJobTasks();
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
      const newItemElement =
        this.accordionItems.toArray()[newItemIndex].nativeElement;
      newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        next: (tasks) => {
          this.jobTasks = tasks.map((task) => ({
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
              this.jobTasks = this.jobTasks.map((jt) => ({
                ...jt,
                isNew: false,
              }));
            }, 3000);
          }
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

  clearFilter(): void {
    this.filter = {};
    this.loadJobTasks();
  }

  onEgSelected(selectedEg: string): void {
    console.log('Selected:', selectedEg);
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
      }
    });
  }

  truncate(text: string, maxLength: number): string {
    return truncateText(text, maxLength);
  }

  toggleAccordion(id: number): void {
    // Save any pending changes when toggling accordion
    if (this.expandedItemId) {
      const expandedItem = this.jobTasks.find(
        (jt) => jt.id === this.expandedItemId
      );
      if (expandedItem && expandedItem.id) {
        this.jobTasksService
          .updateJobTask(expandedItem.id, {
            text: this.htmlContent,
            metadata: expandedItem.metadata,
          })
          .subscribe();
      }
    }
    if (this.expandedItemId === id) {
      this.expandedItemId = null;
      this.htmlContent = '';
    } else {
      this.expandedItemId = id;
      this.jobTasksService.getJobTaskById(id).subscribe({
        next: (task) => {
          this.htmlContent = task.text || '';
        },
        error: (error) => {
          console.error('Error loading task content:', error);
          this.htmlContent = '';
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

    const newTags = this.tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag)
      .map((name) => ({ id: Math.random(), name }));

    if (!item.tags) {
      item.tags = [];
    }

    item.tags = [...new Set([...item.tags, ...newTags])];
    this.tagInput = '';

    this.jobTasksService
      .updateJobTask(item.id!, {
        tags: item.tags.map((tag) => tag.name),
      })
      .subscribe();
  }

  removeTag(item: JobTask, tagToRemove: Tag): void {
    if (!item.tags) return;
    item.tags = item.tags.filter((tag) => tag.name !== tagToRemove.name);
    this.jobTasksService
      .updateJobTask(item.id!, {
        tags: item.tags.map((tag) => tag.name),
      })
      .subscribe();
  }

  handleKeyPress(event: KeyboardEvent, item: JobTask): void {
    if (event.key === 'Enter') {
      this.addTags(item);
    }
  }

  deleteItem(item: JobTask): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eintrag löschen?',
        onConfirmCallback: () => {
          this.jobTasksService.deleteJobTask(item.id!).subscribe({
            next: () => {
              console.log('Job task deleted successfully');
              this.loadJobTasks();
            },
            error: (error) => {
              console.error('Error deleting job task:', error);
            },
          });
        },
      },
    });
  }

  trackById(index: number, item: JobTask): number {
    return item.id!;
  }

  onOverlayModalClosed(): void {
    // Save any pending changes when the modal is closed
    const expandedItem = this.jobTasks.find(
      (jt) => jt.id === this.expandedItemId
    );
    if (expandedItem && expandedItem.id) {
      this.addTags(expandedItem);
      this.jobTasksService
        .updateJobTask(expandedItem.id, {
          title: expandedItem.title,
          text: this.htmlContent,
          metadata: expandedItem.metadata,
        })
        .subscribe();
    }
    this.closeModal.emit();
  }
}
