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
      const currentBacklog = this.cardsSubject.value.filter(
        (c) => c.classification !== card.classification,
      );
      this.cardsSubject.next(currentBacklog);

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
    const removedCard = currentDisplay.splice(index, 1)[0];
    const percentages = this.calculateAdjustedPercentages(
      currentDisplay.length,
    );
    currentDisplay.forEach((c, i) => (c.percentage = percentages[i]));
    this.displayCardsSubject.next(currentDisplay);

    const currentBacklog = [...this.cardsSubject.value, removedCard];
    currentBacklog.sort((a, b) => {
      const numA = parseInt(a.classification.split(' ')[1], 10);
      const numB = parseInt(b.classification.split(' ')[1], 10);
      return numA - numB;
    });
    this.cardsSubject.next(currentBacklog);

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

  updateWithNewPercentage(card: Card) {
    const currentDisplay = [...this.displayCardsSubject.value];
    const cardIndex = currentDisplay.findIndex(
      (c) => c.classification === card.classification,
    );
    if (cardIndex >= 0) {
      const count = currentDisplay.length;
      const minOtherTotal = 5 * (count - 1);
      const maxNewPercentage = 100 - minOtherTotal;

      // Clamp and round to nearest 5
      let adjustedPercentage = Math.max(
        5,
        Math.min(card.percentage, maxNewPercentage),
      );
      adjustedPercentage = Math.round(adjustedPercentage / 5) * 5;

      currentDisplay[cardIndex].percentage = adjustedPercentage;

      const remaining = 100 - adjustedPercentage;
      const remainingAfterMin = remaining - 5 * (count - 1);
      const extraSteps = remainingAfterMin / 5; // Will be integer due to clamping

      const otherIndices = currentDisplay
        .map((_, i) => i)
        .filter((i) => i !== cardIndex);

      if (otherIndices.length > 0) {
        const stepsPerCard = Math.floor(extraSteps / otherIndices.length);
        let remainder = extraSteps % otherIndices.length;

        otherIndices.forEach((i, index) => {
          let steps = stepsPerCard;
          if (index < remainder) {
            steps += 1;
          }
          currentDisplay[i].percentage = 5 + steps * 5;
        });
      }

      this.displayCardsSubject.next(currentDisplay);
    }
  }
}
