import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDragPreview,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { JobDescriptionTitleDialogComponent } from '../../components/job-descriptions/job-description-title-dialog/job-description-title-dialog.component';
import { CardService } from '../../services/card.service';
import { Card, getNextPastelColor } from '../../utils/card.utils';
import { CardTooltipDirective } from '../../utils/directives/card-tooltip.directive';
import { truncateHtml, getTruncatedPlainText } from '../../utils/card.utils';
import { OverlayModalComponent } from '../../components/overlay-modal/overlay-modal.component';
import { JtOverviewAccordionComponent } from '../../components/job-tasks/overview-accordion/jt-overview-accordion.component';
import { JobDescription } from '../../types/job-descriptions';
import { CurrentWorkspaceService } from '../../services/current-workspace.service';
import { JobDescriptionsService } from '../../services/job-descriptions.service';
const MAX_DISPLAY_CARDS = 10;

@Component({
  selector: 'app-card-backlog-column',
  templateUrl: './card-backlog-column.component.html',
  standalone: true,
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDragPreview,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    CardTooltipDirective,
    OverlayModalComponent,
    JtOverviewAccordionComponent,
  ],
})
export class CardBacklogColumnComponent implements OnInit {
  @ViewChild('displayScrollContainer', { static: false })
  private scrollContainer?: ElementRef<HTMLElement>;
  @ViewChild('backlogSearchInput')
  backlogSearchInputRef!: ElementRef<HTMLInputElement>;

  isWorkspaceSet = false;
  private allBacklogCards: Card[] = [];
  backlogCards: Card[] = [];
  displayCards: Card[] = [];
  selectedCard: Card | null = null;
  currentIndex = 0;
  private _snackBar = inject(MatSnackBar);
  isJobTaskModalOpen = false;
  selectedCardToOpenModal: Card | null = null;
  private currentSearchTerm: string = '';

  constructor(
    private dialog: MatDialog,
    private cardService: CardService,
    private currentWorkspaceService: CurrentWorkspaceService,
    private jobDescriptionsService: JobDescriptionsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.currentWorkspaceService.currentJobDescription.subscribe(
      (jobDescription) => {
        this.isWorkspaceSet = jobDescription !== null;
        if (!jobDescription) {
          this.currentSearchTerm = '';
          if (this.backlogSearchInputRef) {
            this.backlogSearchInputRef.nativeElement.value = '';
          }
          this.cardService.initializeCards();
        }
      }
    );

    this.cardService.cards$.subscribe((cards) => {
      this.allBacklogCards = cards;
      this.applySearchFilter(this.currentSearchTerm);
    });

    this.cardService.displayCards$.subscribe((displayCards) => {
      this.displayCards = displayCards;
    });

    this.cardService.selectedCard$.subscribe((card) => {
      this.selectedCard = card;
      setTimeout(() => this.scrollToSelectedCard(), 50);
    });
  }

  private scrollToSelectedCard() {
    if (!this.selectedCard || !this.scrollContainer) return;

    const container = this.scrollContainer.nativeElement;
    const cardElement = container.querySelector(
      `[data-classification="${this.selectedCard.classification}"]`
    ) as HTMLElement;

    if (cardElement) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = cardElement.getBoundingClientRect();

      if (cardRect.top < containerRect.top) {
        container.scrollTop -= containerRect.top - cardRect.top;
      } else if (cardRect.bottom > containerRect.bottom) {
        container.scrollTop += cardRect.bottom - containerRect.bottom;
      }
    }
  }

  onSearch(event: Event) {
    this.currentSearchTerm = (event.target as HTMLInputElement).value;
    this.applySearchFilter(this.currentSearchTerm);
  }

  private applySearchFilter(searchTerm: string): void {
    const termToFilter = searchTerm.trim().toLowerCase();
    if (!termToFilter) {
      this.backlogCards = [...this.allBacklogCards];
      return;
    }

    this.backlogCards = this.allBacklogCards.filter((card) => {
      const tags = card.tags.join(' ');
      const text = `${tags} ${card.title} ${card.text}`.toLowerCase();
      const keywords = termToFilter.split(/\s+/);
      return keywords.every((keyword) => text.includes(keyword));
    });
  }

  clearSearch(inputElement: HTMLInputElement) {
    inputElement.value = '';
    this.currentSearchTerm = '';
    this.applySearchFilter('');
  }

  drop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      this.cardService.moveInDisplay(event.previousIndex, event.currentIndex);
    } else {
      if (event.previousContainer.id === 'backlog') {
        if (this.displayCards.length < MAX_DISPLAY_CARDS) {
          this.cardService.addToDisplay(
            event.previousContainer.data[event.previousIndex],
            event.currentIndex
          );
        } else {
          this.openSnackBar(
            'Maximale Anzahl an Arbeitsvorgängen erreicht',
            'Akzeptieren'
          );
        }
      }
      if (event.previousContainer.id === 'display') {
        this.cardService.removeFromDisplay(event.previousIndex);
      }
    }
  }

  moveCardToTop(index: number) {
    this.cardService.moveCardToTop(index);
  }

  moveCardToBottom(index: number) {
    this.cardService.moveCardToBottom(index);
  }

  getPastelColor(currentIndex: number): string {
    return getNextPastelColor(currentIndex);
  }

  getSafeHtml(html: string, maxLength: number): SafeHtml {
    const truncatedContent = truncateHtml(html, maxLength);
    return this.sanitizer.bypassSecurityTrustHtml(truncatedContent);
  }

  getTruncatedText(text: string, maxLength: number): string {
    return getTruncatedPlainText(text, maxLength);
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(JobDescriptionTitleDialogComponent, {
      width: '600px',
      data: {
        isEditing: false,
      },
    });

    dialogRef.afterClosed().subscribe((result: JobDescription) => {
      if (result) {
        this.currentWorkspaceService.setCurrentJobDescription(result);
        this.jobDescriptionsService.getJobDescriptions().subscribe();
      }
    });
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }

  selectCard(card: Card) {
    this.cardService.selectCard(card);
  }

  emitAlert() {
    alert('TODO');
  }

  removeFromDisplay(index: number) {
    this.cardService.removeFromDisplay(index);
  }

  openDialogWithCard(card: Card) {
    this.isJobTaskModalOpen = true;
    this.selectedCardToOpenModal = card;
  }

  closeJobTaskModal() {
    this.isJobTaskModalOpen = false;
    this.selectedCardToOpenModal = null;
  }
}
