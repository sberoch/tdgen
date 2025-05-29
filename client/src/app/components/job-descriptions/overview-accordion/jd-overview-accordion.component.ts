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
import { CurrentWorkspaceService } from '../../../services/current-workspace.service';
import {
  JobDescriptionFilter,
  JobDescriptionsService,
} from '../../../services/job-descriptions.service';
import { JobDescription } from '../../../types/job-descriptions';
import { Tag } from '../../../types/tag';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog-component';
import { JobDescriptionTitleDialogComponent } from '../job-description-title-dialog/job-description-title-dialog.component';
import { getTruncatedPlainText } from '../../../utils/card.utils';

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
  @Input() initialJobDescription: JobDescription | null = null;

  expandedItemId: number | null = null;
  tagInput: string = '';
  filter: JobDescriptionFilter = {};
  newlyCreatedTitle: string | null = null;
  shouldScrollToNew: boolean = false;
  totalJobDescriptionsCount: number = 0;
  filteredJobDescriptionsCount: number = 0;
  @ViewChildren('accordionItem') accordionItems!: QueryList<ElementRef>;
  @ViewChild('searchInput') searchInput!: ElementRef;
  @Output() closeModal = new EventEmitter<void>();

  jobDescriptions: ExpandableJobDescription[] = [];

  constructor(
    private dialog: MatDialog,
    private jobDescriptionsService: JobDescriptionsService,
    private currentWorkspaceService: CurrentWorkspaceService
  ) {}

  ngOnInit(): void {
    this.loadJobDescriptions();
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
      const newItemElement =
        this.accordionItems.toArray()[newItemIndex].nativeElement;
      newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

        // If there's a newly created item, flag for scrolling and remove the "new" status after 3 seconds
        if (
          this.newlyCreatedTitle !== null ||
          this.initialJobDescription !== null
        ) {
          this.shouldScrollToNew = true;

          // Auto-expand the new item
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

  loadJobDescriptionIntoWorkplace(item: JobDescription): void {
    this.currentWorkspaceService.triggerJobDescriptionFetch(item);
    this.onOverlayModalClosed();
  }

  resetSearchInput(): void {
    this.filter = {};
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
  }

  resetFiltersAndInput(): void {
    this.filter = {};
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
    this.loadJobDescriptions();
  }

  onOverlayModalClosed(): void {
    // Save any pending changes when the modal is closed
    const expandedItem = this.jobDescriptions.find(
      (jd) => jd.id === this.expandedItemId
    );
    if (expandedItem && expandedItem.id) {
      this.addTags(expandedItem);

      this.jobDescriptionsService
        .updateJobDescription(expandedItem.id, {
          title: expandedItem.title,
          metadata: expandedItem.metadata,
        })
        .subscribe({
          next: () => {
            console.log('Job description updated on modal close');
          },
          error: (error) => {
            console.error(
              'Error updating job description on modal close:',
              error
            );
          },
        });
    }
    this.closeModal.emit();
  }
}
