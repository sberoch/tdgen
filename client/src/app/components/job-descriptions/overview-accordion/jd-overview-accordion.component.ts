import { Component } from '@angular/core';
import { TitleActivityDialogComponent } from '../../title-activity-dialog/title-activity-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TitleService } from '../../../services/title.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { truncateText } from '../../../utils/card.utils';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

interface JobDescription {
  title: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  id?: number;
  expanded?: boolean;
  tags?: string[];
}

@Component({
  selector: 'app-jd-overview-accordion',
  templateUrl: './jd-overview-accordion.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, FormsModule],
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
export class JdOverviewAccordionComponent {
  expandedItemId: number | null = null;
  tagInput: string = '';

  mockData: JobDescription[] = [
    {
      id: 1,
      title: 'Sachbearbeiter CIT Linux-Experte A',
      createdAt: '24.02.2025',
      updatedAt: '25.02.2025',
      tags: ['Linux', 'System Administration'],
    },
    {
      id: 2,
      title: 'Sachbearbeiter CIT Linux-Experte C',
      createdAt: '03.05.2025',
    },
    {
      id: 3,
      title: 'Sachbearbeiter CIT Linux-Experte D',
      createdAt: '24.01.2025',
      updatedAt: '03.03.2025',
      deletedAt: '04.04.2025',
    },
    {
      id: 4,
      title: 'Sachbearbeiter CIT Linux-Experte E',
      createdAt: '12.06.2025',
    },
    {
      id: 5,
      title: 'Sachbearbeiter CIT Linux-Experte F',
      createdAt: '18.07.2025',
    },
    {
      id: 6,
      title: 'Sachbearbeiter CIT Linux-Experte G',
      createdAt: '30.08.2025',
    },
    {
      id: 7,
      title: 'Sachbearbeiter CIT Linux-Experte H',
      createdAt: '02.09.2025',
    },
    {
      id: 8,
      title: 'Sachbearbeiter CIT Linux-Experte I',
      createdAt: '14.10.2025',
    },
    {
      id: 9,
      title: 'Sachbearbeiter CIT Linux-Experte J',
      createdAt: '05.11.2025',
    },
    {
      id: 10,
      title: 'Sachbearbeiter CIT Linux-Experte K',
      createdAt: '19.12.2025',
    },
    {
      id: 11,
      title: 'Sachbearbeiter CIT Linux-Experte L',
      createdAt: '13.01.2026',
    },
    {
      id: 12,
      title: 'Sachbearbeiter CIT Linux-Experte M',
      createdAt: '27.02.2026',
    },
  ];

  constructor(private dialog: MatDialog, private titleService: TitleService) {}

  openCreateDialog() {
    const dialogRef = this.dialog.open(TitleActivityDialogComponent, {
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.titleService.updateTitle(result);
      }
    });
  }

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

  addTags(item: JobDescription): void {
    console.log(this.tagInput);
    if (!this.tagInput.trim()) return;

    const newTags = this.tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    if (!item.tags) {
      item.tags = [];
    }
    item.tags = [...new Set([...item.tags, ...newTags])];
    this.tagInput = '';
  }

  removeTag(item: JobDescription, tagToRemove: string): void {
    if (!item.tags) return;
    item.tags = item.tags.filter((tag) => tag !== tagToRemove);
  }

  handleKeyPress(event: KeyboardEvent, item: JobDescription): void {
    if (event.key === 'Enter') {
      this.addTags(item);
    }
  }
}
