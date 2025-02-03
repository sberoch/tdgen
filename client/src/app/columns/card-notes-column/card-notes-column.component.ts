import { Component } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { createCards } from '../card-backlog-column/card-backlog-column.utils';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-card-notes-column',
  templateUrl: './card-notes-column.component.html',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, FormsModule, MatInputModule],
})
export class CardNotesColumnComponent {
  cards = createCards(20);
  percentages = [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
  ];
}
