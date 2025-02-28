import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDragPreview,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import {
  Component,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivityDialogComponent } from '../../components/activity-dialog/activity-dialog.component';
import { CardService } from '../../services/card.service';
import { TitleService } from '../../services/title.service';
import { Card, getNextPastelColor } from '../../utils/card.utils';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { truncateText } from './card-backlog-column.utils';

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
    private cardService: CardService,
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
      `[data-classification="${this.selectedCard.classification}"]`,
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

    this.backlogCards = this.allBacklogCards.filter(
      (card) =>
        card.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  drop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      this.cardService.moveInDisplay(event.previousIndex, event.currentIndex);
    } else {
      if (event.previousContainer.id === 'backlog') {
        if (this.displayCards.length < MAX_DISPLAY_CARDS) {
          this.cardService.addToDisplay(
            event.previousContainer.data[event.previousIndex],
            event.currentIndex,
          );
        } else {
          this.openSnackBar(
            'Maximale Anzahl an Arbeitsvorgängen erreicht',
            'Akzeptieren',
          );
        }
      }
      if (event.previousContainer.id === 'display') {
        this.cardService.removeFromDisplay(event.previousIndex);
      }
    }
  }

  getPastelColor(currentIndex: number): string {
    return getNextPastelColor(currentIndex);
  }

  truncate(text: string, maxLength: number): string {
    return truncateText(text, maxLength);
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(ActivityDialogComponent, {
      width: '600px',
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
