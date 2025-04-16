import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewChecked,
} from '@angular/core';
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
  isNew?: boolean;
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
export class JdOverviewAccordionComponent implements OnInit, AfterViewChecked {
  expandedItemId: number | null = null;
  tagInput: string = '';
  filter: JobDescriptionFilter = {};
  newlyCreatedTitle: string | null = null;
  shouldScrollToNew: boolean = false;

  @ViewChildren('accordionItem') accordionItems!: QueryList<ElementRef>;

  jobDescriptions: ExpandableJobDescription[] = [];

  constructor(
    private dialog: MatDialog,
    private titleService: TitleService,
    private jobDescriptionsService: JobDescriptionsService
  ) {}

  ngOnInit(): void {
    this.loadJobDescriptions();
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
      const newItemElement =
        this.accordionItems.toArray()[newItemIndex].nativeElement;
      newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  loadJobDescriptions(): void {
    this.jobDescriptionsService.getJobDescriptions(this.filter).subscribe({
      next: (data) => {
        this.jobDescriptions = data.map((jd) => ({
          ...jd,
          expanded:
            this.newlyCreatedTitle !== null &&
            jd.title === this.newlyCreatedTitle,
          isNew:
            this.newlyCreatedTitle !== null &&
            jd.title === this.newlyCreatedTitle,
        }));

        // If there's a newly created item, flag for scrolling and remove the "new" status after 3 seconds
        if (this.newlyCreatedTitle !== null) {
          this.shouldScrollToNew = true;

          // Auto-expand the new item
          const newItem = this.jobDescriptions.find(
            (jd) => jd.title === this.newlyCreatedTitle
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
          }, 3000);
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
        this.newlyCreatedTitle = result;
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
        this.newlyCreatedTitle = result;
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
