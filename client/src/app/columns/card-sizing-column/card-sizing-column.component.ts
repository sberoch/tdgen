import { Component, OnInit, HostListener } from '@angular/core';
import { CardService } from '../../services/card.service';
import { Card, getNextPastelColor } from '../../utils/card.utils';
import { MatIconModule } from '@angular/material/icon';

interface Section {
  card: Card;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-card-sizing-column',
  templateUrl: './card-sizing-column.component.html',
  standalone: true,
  imports: [MatIconModule],
})
export class CardSizingColumnComponent implements OnInit {
  cards: Card[] = [];
  selectedCard: Card | null = null;
  sections: Section[] = [];
  isDragging = false;
  startY = 0;
  currentIndex = 0;
  initialPercentages: [number, number] = [0, 0];
  private accumulatedDelta = 0;
  private lastAppliedDirection: 'up' | 'down' | null = null;

  constructor(private cardService: CardService) {}

  ngOnInit() {
    this.cardService.displayCards$.subscribe((cards) => {
      this.cards = cards;
      this.sections = cards.map((card, index) => ({
        card,
        percentage: card.percentage,
        color: getNextPastelColor(index),
      }));
    });

    this.cardService.selectedCard$.subscribe((card) => {
      this.selectedCard = card;
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaY = this.startY - event.clientY;
    const screenHeight = window.innerHeight;
    const pixelsPerStep = screenHeight * 0.05;

    this.accumulatedDelta += deltaY;
    this.startY = event.clientY;

    const currentDirection = this.accumulatedDelta < 0 ? 'up' : 'down';
    const absoluteDelta = Math.abs(this.accumulatedDelta);

    const steps = Math.floor(absoluteDelta / pixelsPerStep);
    if (steps > 0) {
      this.adjustPercentages(currentDirection, steps * 5);
      this.accumulatedDelta = this.accumulatedDelta % pixelsPerStep;
      this.lastAppliedDirection = currentDirection;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.accumulatedDelta = 0;
    this.lastAppliedDirection = null;
  }

  startDrag(event: MouseEvent, index: number) {
    this.isDragging = true;
    this.startY = event.clientY;
    this.currentIndex = index;
    this.initialPercentages = [
      this.sections[index].percentage,
      this.sections[index + 1].percentage,
    ];
  }

  private adjustPercentages(direction: 'up' | 'down', change: number) {
    const upperIndex = this.currentIndex;
    const lowerIndex = this.currentIndex + 1;

    const originalValues = this.sections.map((s) => s.percentage);

    let upperChange = direction === 'up' ? change : -change;
    let lowerChange = -upperChange;

    const newUpper = Math.max(5, originalValues[upperIndex] + upperChange);
    const newLower = Math.max(5, originalValues[lowerIndex] + lowerChange);

    const actualUpperChange = newUpper - originalValues[upperIndex];
    const actualLowerChange = newLower - originalValues[lowerIndex];

    let workingPercentages = [...originalValues];
    workingPercentages[upperIndex] += actualUpperChange;
    workingPercentages[lowerIndex] += actualLowerChange;

    workingPercentages = this.normalizePercentages(workingPercentages);

    workingPercentages.forEach((percentage, index) => {
      this.sections[index].percentage = percentage;
      this.cards[index].percentage = percentage;
    });
  }

  private normalizePercentages(percentages: number[]): number[] {
    const total = percentages.reduce((a, b) => a + b, 0);
    let delta = total - 100;
    const normalized = [...percentages];

    while (delta !== 0) {
      if (delta > 0) {
        const candidates = normalized
          .map((p, i) => ({ index: i, value: p }))
          .filter((p) => p.value > 5)
          .sort((a, b) => b.value - a.value);

        if (candidates.length === 0) break;
        normalized[candidates[0].index] -= 5;
        delta -= 5;
      } else {
        const candidates = normalized
          .map((p, i) => ({ index: i, value: p }))
          .sort((a, b) => a.value - b.value);

        if (candidates.length === 0) break;
        normalized[candidates[0].index] += 5;
        delta += 5;
      }
    }

    return normalized;
  }

  selectCard(card: Card) {
    this.cardService.selectCard(card);
  }
}
