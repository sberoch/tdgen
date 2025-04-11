import { Component, OnInit } from '@angular/core';
import { TitleActivityDialogComponent } from '../../title-activity-dialog/title-activity-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TitleService } from '../../../services/title.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { truncateText } from '../../../utils/card.utils';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog-component';
import {
  JobDescriptionFilter,
  JobDescriptionsService,
} from '../../../services/job-descriptions.service';
import { JobDescription } from '../../../types/job-descriptions';

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
    const dialogRef = this.dialog.open(TitleActivityDialogComponent, {
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.titleService.updateTitle(result);
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
    console.log(this.tagInput);
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
