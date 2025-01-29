import { Component } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDrag,
  CdkDropList,
  CdkDragPlaceholder,
  copyArrayItem,
  CdkDragPreview,
} from '@angular/cdk/drag-drop';
import { Card, getNextPastelColor } from './card-backlog-column.utils';
import { createCards } from './card-backlog-column.utils';

const MAX_DISPLAY_CARDS = 10;

@Component({
  selector: 'app-card-backlog-column',
  templateUrl: './card-backlog-column.component.html',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragPlaceholder, CdkDragPreview],
})
export class CardBacklogColumnComponent {
  private allBacklogCards = createCards(20);
  backlogCards: Card[] = this.allBacklogCards;
  displayCards: Card[] = [];

  onSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    if (!searchTerm.trim()) {
      this.backlogCards = this.allBacklogCards;
      return;
    }

    this.backlogCards = this.allBacklogCards.filter((card) =>
      card.text.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  drop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      if (
        this.displayCards.length < MAX_DISPLAY_CARDS &&
        event.previousContainer.id === 'backlog'
      ) {
        copyArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
      }
      if (event.previousContainer.id === 'display') {
        this.displayCards.splice(event.previousIndex, 1);
      }
    }
  }

  getPastelColor(currentIndex: number): string {
    return getNextPastelColor(currentIndex);
  }
}
