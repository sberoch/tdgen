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
import { JobDescriptionTitleDialogComponent } from '../../components/job-description-title-dialog/job-description-title-dialog.component';
import { CardService } from '../../services/card.service';
import { TitleService } from '../../services/title.service';
import { Card, getNextPastelColor } from '../../utils/card.utils';
import { CardTooltipDirective } from '../../utils/directives/card-tooltip.directive';
import { truncateText } from '../../utils/card.utils';

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
  ],
})
export class CardBacklogColumnComponent implements OnInit {
  @ViewChild('displayScrollContainer', { static: false })
  private scrollContainer?: ElementRef<HTMLElement>;

  currentTitle: string = '';
  private allBacklogCards: Card[] = [];
  backlogCards: Card[] = [];
  displayCards: Card[] = [];
  selectedCard: Card | null = null;
  currentIndex = 0;
  private _snackBar = inject(MatSnackBar);

  constructor(
    private dialog: MatDialog,
    private titleService: TitleService,
    private cardService: CardService
  ) {}

  ngOnInit() {
    this.titleService.currentTitle.subscribe((title) => {
      if (title) this.currentTitle = title;
    });

    this.cardService.cards$.subscribe((cards) => {
      this.allBacklogCards = cards;
      this.backlogCards = [...this.allBacklogCards];
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
    const searchTerm = (event.target as HTMLInputElement).value;
    if (!searchTerm.trim()) {
      this.backlogCards = this.allBacklogCards;
      return;
    }

    this.backlogCards = this.allBacklogCards.filter((card) => {
      const tags = card.tags.join(' ');
      const text = `${tags} ${card.title} ${card.text}`.toLowerCase();
      const keywords = searchTerm.toLowerCase().split(/\s+/);
      return keywords.every((keyword) => text.includes(keyword));
    });
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

  truncate(text: string, maxLength: number): string {
    return truncateText(text, maxLength);
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
}
