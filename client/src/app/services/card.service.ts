import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  Card,
  createCards,
} from '../columns/card-backlog-column/card-backlog-column.utils';
import { moveItemInArray } from '@angular/cdk/drag-drop';

@Injectable({
  providedIn: 'root',
})
export class CardService {
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  private displayCardsSubject = new BehaviorSubject<Card[]>([]);

  cards$ = this.cardsSubject.asObservable();
  displayCards$ = this.displayCardsSubject.asObservable();

  constructor() {
    this.initializeCards();
  }

  private initializeCards() {
    const cards = createCards(15);
    this.cardsSubject.next(cards);
  }

  addToDisplay(card: Card, index: number) {
    const currentDisplay = [...this.displayCardsSubject.value];
    const isDuplicate = currentDisplay.some(
      (existingCard) => existingCard.text === card.text,
    );
    if (!isDuplicate) {
      currentDisplay.splice(index, 0, card);
      this.displayCardsSubject.next(currentDisplay);
    }
  }

  removeFromDisplay(index: number) {
    const currentDisplay = [...this.displayCardsSubject.value];
    currentDisplay.splice(index, 1);
    this.displayCardsSubject.next(currentDisplay);
  }

  moveInDisplay(previousIndex: number, currentIndex: number) {
    const currentDisplay = [...this.displayCardsSubject.value];
    moveItemInArray(currentDisplay, previousIndex, currentIndex);
    this.displayCardsSubject.next(currentDisplay);
  }
}
