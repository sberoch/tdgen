import { Component, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDrag,
  CdkDropList,
  CdkDragPlaceholder,
  copyArrayItem,
  CdkDragPreview,
} from '@angular/cdk/drag-drop';
import { Card, getNextPastelColor } from './card-backlog-column.utils';
import { createCards } from './card-backlog-column.utils';
import { MatDialog } from '@angular/material/dialog';
import { ActivityDialogComponent } from '../../components/activity-dialog/activity-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { TitleService } from '../../services/title.service';

const MAX_DISPLAY_CARDS = 10;

@Component({
  selector: 'app-card-backlog-column',
  templateUrl: './card-backlog-column.component.html',
  standalone: true,
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDragPreview,
    MatDialogModule,
  ],
})
export class CardBacklogColumnComponent implements OnInit {
  currentTitle: string = '';
  private allBacklogCards = createCards(15);
  backlogCards: Card[] = this.allBacklogCards;
  displayCards: Card[] = [];

  constructor(
    private dialog: MatDialog,
    private titleService: TitleService,
  ) {}

  ngOnInit() {
    this.titleService.currentTitle.subscribe((title) => {
      if (title) this.currentTitle = title;
    });
  }

  onSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    if (!searchTerm.trim()) {
      this.backlogCards = this.allBacklogCards;
      return;
    }

    this.backlogCards = this.allBacklogCards.filter((card) =>
      card.text.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  drop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      if (
        this.displayCards.length < MAX_DISPLAY_CARDS &&
        event.previousContainer.id === 'backlog'
      ) {
        copyArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
      }
      if (event.previousContainer.id === 'display') {
        this.displayCards.splice(event.previousIndex, 1);
      }
    }
  }

  getPastelColor(currentIndex: number): string {
    return getNextPastelColor(currentIndex);
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(ActivityDialogComponent, {
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.titleService.updateTitle(result);
      }
    });
  }
}
