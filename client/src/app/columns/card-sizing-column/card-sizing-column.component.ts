import { Component, OnInit } from '@angular/core';
import { CardService } from '../../services/card.service';
import { Card } from '../card-backlog-column/card-backlog-column.utils';
import { getNextPastelColor } from '../card-backlog-column/card-backlog-column.utils';

interface Section {
  card: Card;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-card-sizing-column',
  templateUrl: './card-sizing-column.component.html',
})
export class CardSizingColumnComponent implements OnInit {
  cards: Card[] = [];
  selectedCard: Card | null = null;
  sections: Section[] = [];

  constructor(private cardService: CardService) {}

  ngOnInit() {
    this.cardService.displayCards$.subscribe((cards) => {
      this.cards = cards;
      this.sections = cards.map((card, index) => ({
        card,
        percentage: 100 / cards.length,
        color: getNextPastelColor(index),
      }));
    });

    this.cardService.selectedCard$.subscribe((card) => {
      this.selectedCard = card;
    });
  }

  selectCard(card: Card) {
    this.cardService.selectCard(card);
  }
}
