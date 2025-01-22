import { Component } from '@angular/core';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { CardBacklogColumnComponent } from './columns/card-backlog-column/card-backlog-column.component';
import { CardSizingColumnComponent } from './columns/card-sizing-column/card-sizing-column.component';
import { CardDisplayColumnComponent } from './columns/card-display-column/card-display-column.component';
import { CardNotesColumnComponent } from './columns/card-notes-column/card-notes-column.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    CardBacklogColumnComponent,
    CardDisplayColumnComponent,
    CardSizingColumnComponent,
    CardNotesColumnComponent,
  ],
})
export class AppComponent {
  title = 'client';
}
