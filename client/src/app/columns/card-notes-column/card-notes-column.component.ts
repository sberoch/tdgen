import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CardService } from '../../services/card.service';
import { Card, getNextPastelColor } from '../../utils/card.utils';

@Component({
  selector: 'app-card-notes-column',
  templateUrl: './card-notes-column.component.html',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, FormsModule, MatInputModule],
})
export class CardNotesColumnComponent implements OnInit {
  cards: Card[] = [];
  selectedCard: Card | null = null;
  selectedClassification: string | null = null;
  selectedCardColor: string = '#ffffff';

  constructor(private cardService: CardService) {}

  ngOnInit() {
    this.cardService.displayCards$.subscribe((cards) => {
      this.cards = cards;
      this.updateSelectedClassification();
    });

    this.cardService.selectedCard$.subscribe((card) => {
      this.selectedCard = card;
      this.selectedClassification = card?.classification || null;

      if (card) {
        const cardIndex = this.cards.findIndex(
          (c) => c.classification === card.classification,
        );
        this.selectedCardColor =
          cardIndex >= 0 ? getNextPastelColor(cardIndex) : '#ccc';
      } else {
        this.selectedCardColor = '#ccc';
      }
    });
  }

  private updateSelectedClassification() {
    if (this.selectedCard) {
      const currentCard = this.cards.find(
        (c) => c.classification === this.selectedCard?.classification,
      );
      this.selectedClassification = currentCard?.classification || null;
    }
  }

  onCardSelected(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const classification = selectElement.value;
    const selectedCard = this.cards.find(
      (card) => card.classification === classification,
    );

    if (selectedCard) {
      this.cardService.selectCard(selectedCard);
    }
  }
}
