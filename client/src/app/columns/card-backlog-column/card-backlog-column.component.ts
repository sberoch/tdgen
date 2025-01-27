import { Component } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
  CdkDragPlaceholder,
} from '@angular/cdk/drag-drop';
import { Card, getNextPastelColor } from './card-backlog-column.utils';
import { createCards } from './card-backlog-column.utils';

@Component({
  selector: 'app-card-backlog-column',
  templateUrl: './card-backlog-column.component.html',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragPlaceholder],
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
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  getPastelColor(currentIndex: number): string {
    return getNextPastelColor(currentIndex);
  }
}
