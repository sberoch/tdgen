import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class JtOverviewAccordionComponent implements OnInit, OnDestroy {
  expandedItemId: number | null = null;
  tagInput: string = '';
  htmlContent: string = '';
  jobTasks: JobTask[] = [];
  private subscription: Subscription = new Subscription();
  filter: JobTaskFilter = {};
  showDeleted: boolean = false;
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

  constructor(
    private dialog: MatDialog,
    private jobTasksService: JobTasksService
  ) {}

  ngOnInit(): void {
    this.loadJobTasks();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadJobTasks(): void {
    this.subscription.add(
      this.jobTasksService.getJobTasks(this.filter).subscribe({
        next: (tasks) => {
          this.jobTasks = tasks;
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

  truncate(text: string, maxLength: number): string {
    return truncateText(text, maxLength);
  }

  toggleAccordion(id: number): void {
    if (this.expandedItemId === id) {
      this.expandedItemId = null;
    } else {
      this.expandedItemId = id;
      this.jobTasksService.getJobTaskById(id).subscribe((task) => {
        this.htmlContent = task.text || '';
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
      .filter((tag) => tag);

    if (!item.tags) {
      item.tags = [];
    }

    item.tags = [...new Set([...item.tags, ...newTags])];
    this.tagInput = '';

    this.jobTasksService.updateJobTask(item.id!, item).subscribe();
  }

  removeTag(item: JobTask, tagToRemove: string): void {
    if (!item.tags) return;
    item.tags = item.tags.filter((tag) => tag !== tagToRemove);
    this.jobTasksService.updateJobTask(item.id!, item).subscribe();
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

  saveContent(item: JobTask): void {
    item.text = this.htmlContent;
    this.jobTasksService.updateJobTask(item.id!, item).subscribe();
  }
}
