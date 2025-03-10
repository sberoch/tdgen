import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../layout/header/header.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { CardBacklogColumnComponent } from '../../columns/card-backlog-column/card-backlog-column.component';
import { CardSizingColumnComponent } from '../../columns/card-sizing-column/card-sizing-column.component';
import { CardNotesColumnComponent } from '../../columns/card-notes-column/card-notes-column.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    CardBacklogColumnComponent,
    CardSizingColumnComponent,
    CardNotesColumnComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {}
