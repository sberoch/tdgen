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
import { FormsModule } from '@angular/forms';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { truncateText } from '../../../utils/card.utils';
import { AngularEditorConfig } from '@kolkov/angular-editor';

interface JobTask {
  title: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  id?: number;
  expanded?: boolean;
  tags?: string[];
}

@Component({
  selector: 'app-jt-overview-accordion',
  templateUrl: './jt-overview-accordion.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    AngularEditorModule,
  ],
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
  tagInput: string = '';
  htmlContent: string = '';
  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    minHeight: '300px',
    toolbarHiddenButtons: [
      ['subscript', 'superscript'],
      ['insertImage', 'insertVideo'],
    ],
  };
  EG_OPTIONS = [
    'EG 1',
    'EG 2',
    'EG 3',
    'EG 4',
    'EG 5',
    'EG 6',
    'EG 7',
    'EG 8',
    'EG 9',
    'EG 10',
    'EG 11',
    'EG 12',
    'EG 13',
    'EG 14',
    'EG 15',
  ];
  mockData: JobTask[] = [
    {
      id: 1,
      title: 'Arbeitsvorgang Linux-Administration A',
      createdAt: '24.02.2025',
      updatedAt: '25.02.2025',
      tags: ['Linux', 'Administration'],
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

  onEgSelected(selectedEg: string): void {
    console.log('Selected:', selectedEg);
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

  addTags(item: JobTask): void {
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

  removeTag(item: JobTask, tagToRemove: string): void {
    if (!item.tags) return;
    item.tags = item.tags.filter((tag) => tag !== tagToRemove);
  }

  handleKeyPress(event: KeyboardEvent, item: JobTask): void {
    if (event.key === 'Enter') {
      this.addTags(item);
    }
  }
}
