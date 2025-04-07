import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { truncateText } from '../../../utils/card.utils';

interface JobTask {
  title: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  id?: number;
  expanded?: boolean;
}

@Component({
  selector: 'app-jt-overview-accordion',
  templateUrl: './jt-overview-accordion.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({
          height: '0',
          padding: '0',
          overflow: 'hidden',
          opacity: 0,
        })
      ),
      state(
        'expanded',
        style({
          height: '*',
          padding: '*',
          overflow: 'hidden',
          opacity: 1,
        })
      ),
      transition('collapsed <=> expanded', [animate('200ms ease-in-out')]),
    ]),
  ],
})
export class JtOverviewAccordionComponent {
  expandedItemId: number | null = null;

  mockData: JobTask[] = [
    {
      id: 1,
      title: 'Arbeitsvorgang Linux-Administration A',
      createdAt: '24.02.2025',
      updatedAt: '25.02.2025',
    },
    {
      id: 2,
      title: 'Arbeitsvorgang Systembetreuung B',
      createdAt: '03.05.2025',
    },
    {
      id: 3,
      title: 'Arbeitsvorgang Netzwerksicherheit C',
      createdAt: '24.01.2025',
      updatedAt: '03.03.2025',
      deletedAt: '04.04.2025',
    },
    {
      id: 4,
      title: 'Arbeitsvorgang Anwendungsentwicklung D',
      createdAt: '12.06.2025',
    },
    {
      id: 5,
      title: 'Arbeitsvorgang Datenbankadministration E',
      createdAt: '18.07.2025',
    },
  ];

  constructor() {}

  truncate(text: string, maxLength: number): string {
    return truncateText(text, maxLength);
  }

  toggleAccordion(id: number): void {
    if (this.expandedItemId === id) {
      this.expandedItemId = null;
    } else {
      this.expandedItemId = id;
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedItemId === id;
  }

  getAccordionState(id: number): string {
    return this.isExpanded(id) ? 'expanded' : 'collapsed';
  }
}
