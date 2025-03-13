import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../layout/header/header.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { CardBacklogColumnComponent } from '../../columns/card-backlog-column/card-backlog-column.component';
import { CardSizingColumnComponent } from '../../columns/card-sizing-column/card-sizing-column.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    CardBacklogColumnComponent,
    CardSizingColumnComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {}
