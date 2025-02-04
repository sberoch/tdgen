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
  private selectedCardSubject = new BehaviorSubject<Card | null>(null);

  cards$ = this.cardsSubject.asObservable();
  displayCards$ = this.displayCardsSubject.asObservable();
  selectedCard$ = this.selectedCardSubject.asObservable();
  constructor() {
    this.initializeCards();
  }

  private initializeCards() {
    const cards = createCards(15);
    this.cardsSubject.next(cards);
  }

  private calculateAdjustedPercentages(count: number): number[] {
    if (count === 0) return [];
    const base = 100 / count;
    let percentages = Array.from(
      { length: count },
      () => Math.round(base / 5) * 5,
    );
    let sum = percentages.reduce((a, b) => a + b, 0);
    let delta = sum - 100;

    while (delta !== 0) {
      if (delta > 0) {
        const maxIndex = percentages.indexOf(Math.max(...percentages));
        percentages[maxIndex] -= 5;
        delta -= 5;
      } else {
        const minIndex = percentages.indexOf(Math.min(...percentages));
        percentages[minIndex] += 5;
        delta += 5;
      }
    }
    return percentages;
  }

  addToDisplay(card: Card, index: number) {
    const currentDisplay = [...this.displayCardsSubject.value];
    const isDuplicate = currentDisplay.some(
      (existingCard) => existingCard.classification === card.classification,
    );

    if (!isDuplicate) {
      currentDisplay.splice(index, 0, card);
      const percentages = this.calculateAdjustedPercentages(
        currentDisplay.length,
      );
      currentDisplay.forEach((c, i) => (c.percentage = percentages[i]));
      this.displayCardsSubject.next(currentDisplay);
    }
    this.selectedCardSubject.next(card);
  }

  removeFromDisplay(index: number) {
    const currentDisplay = [...this.displayCardsSubject.value];
    currentDisplay.splice(index, 1);
    const percentages = this.calculateAdjustedPercentages(
      currentDisplay.length,
    );
    currentDisplay.forEach((c, i) => (c.percentage = percentages[i]));
    this.displayCardsSubject.next(currentDisplay);
    this.selectedCardSubject.next(null);
  }

  moveInDisplay(previousIndex: number, currentIndex: number) {
    const currentDisplay = [...this.displayCardsSubject.value];
    moveItemInArray(currentDisplay, previousIndex, currentIndex);
    this.displayCardsSubject.next(currentDisplay);
    this.selectedCardSubject.next(currentDisplay[currentIndex]);
  }

  selectCard(card: Card) {
    this.selectedCardSubject.next(card);
  }
}
