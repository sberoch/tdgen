import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CardService } from '../../services/card.service';
import { Card } from '../card-backlog-column/card-backlog-column.utils';

@Component({
  selector: 'app-card-notes-column',
  templateUrl: './card-notes-column.component.html',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, FormsModule, MatInputModule],
})
export class CardNotesColumnComponent implements OnInit {
  cards: Card[] = [];
  percentages = [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
  ];

  constructor(private cardService: CardService) {}

  ngOnInit() {
    this.cardService.displayCards$.subscribe((cards) => {
      this.cards = cards;
    });
  }
}
