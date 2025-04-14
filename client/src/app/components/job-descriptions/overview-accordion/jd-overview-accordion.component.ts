import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  JobDescriptionFilter,
  JobDescriptionsService,
} from '../../../services/job-descriptions.service';
import { TitleService } from '../../../services/title.service';
import { JobDescription } from '../../../types/job-descriptions';
import { truncateText } from '../../../utils/card.utils';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog-component';
import { JobDescriptionTitleDialogComponent } from '../job-description-title-dialog/job-description-title-dialog.component';

interface ExpandableJobDescription extends JobDescription {
  expanded: boolean;
}

@Component({
  selector: 'app-jd-overview-accordion',
  templateUrl: './jd-overview-accordion.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, FormsModule],
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
export class JdOverviewAccordionComponent implements OnInit {
  expandedItemId: number | null = null;
  tagInput: string = '';
  filter: JobDescriptionFilter = {};

  jobDescriptions: ExpandableJobDescription[] = [];

  constructor(
    private dialog: MatDialog,
    private titleService: TitleService,
    private jobDescriptionsService: JobDescriptionsService
  ) {}

  ngOnInit(): void {
    this.loadJobDescriptions();
  }

  loadJobDescriptions(): void {
    this.jobDescriptionsService.getJobDescriptions(this.filter).subscribe({
      next: (data) => {
        this.jobDescriptions = data.map((jd) => ({
          ...jd,
          expanded: false,
        }));
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

  clearFilter(): void {
    this.filter = {};
    this.loadJobDescriptions();
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
        this.titleService.updateTitle(result);
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
        this.loadJobDescriptions();
      }
    });
  }

  truncate(text: string, maxLength: number): string {
    return truncateText(text, maxLength);
  }

  toggleAccordion(id: number): void {
    if (this.expandedItemId === id) {
      this.expandedItemId = null;
    } else {
      this.expandedItemId = id;
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedItemId === id;
  }

  getAccordionState(id: number): string {
    return this.isExpanded(id) ? 'expanded' : 'collapsed';
  }

  addTags(item: JobDescription): void {
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
  }

  removeTag(item: JobDescription, tagToRemove: string): void {
    if (!item.tags) return;
    item.tags = item.tags.filter((tag) => tag !== tagToRemove);
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
              console.log('Job description deleted successfully');
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
}
