import { Component, OnInit, HostListener } from '@angular/core';
import { CardService } from '../../services/card.service';
import { Card, getNextPastelColor } from '../../utils/card.utils';
import { MatIconModule } from '@angular/material/icon';
import { CurrentWorkspaceService } from '../../services/current-workspace.service';
import { JobDescriptionsService } from '../../services/job-descriptions.service';
import { JobDescription } from '../../types/job-descriptions';
@Component({
  selector: 'app-card-sizing-column',
  templateUrl: './card-sizing-column.component.html',
  standalone: true,
  imports: [MatIconModule],
})
export class CardSizingColumnComponent implements OnInit {
  selectedCard: Card | null = null;
  cards: Card[] = [];
  isDragging = false;
  startY = 0;
  currentIndex = 0;
  isWorkspaceSet = false;
  private accumulatedDelta = 0;
  private jobDescription: JobDescription | null = null;

  constructor(
    private currentWorkspaceService: CurrentWorkspaceService,
    private cardService: CardService,
    private jobDescriptionsService: JobDescriptionsService
  ) {}

  ngOnInit() {
    this.currentWorkspaceService.currentJobDescription.subscribe(
      (jobDescription) => {
        if (jobDescription) {
          this.jobDescription = jobDescription;
          this.isWorkspaceSet = true;
          this.cards =
            jobDescription?.tasks
              .map((task, index) => ({
                classification: task.jobTask.metadata?.['paymentGroup'] || '',
                jobTask: task.jobTask,
                title: task.jobTask.title,
                text: task.jobTask.text,
                tags: task.jobTask.tags?.map((tag) => tag.name) || [],
                percentage: task.percentage,
                order: task.order,
              }))
              .sort((a, b) => a.order - b.order) || [];
        } else {
          this.isWorkspaceSet = false;
        }
      }
    );
    this.cardService.selectedCard$.subscribe((card) => {
      this.selectedCard = card;
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaY = this.startY - event.clientY;
    const screenHeight = window.innerHeight;
    const pixelsPerStep = screenHeight * 0.05;

    this.accumulatedDelta += deltaY;
    this.startY = event.clientY;

    const currentDirection = this.accumulatedDelta < 0 ? 'up' : 'down';
    const absoluteDelta = Math.abs(this.accumulatedDelta);

    const steps = Math.floor(absoluteDelta / pixelsPerStep);
    if (steps > 0) {
      this.adjustPercentages(currentDirection, steps * 5);
      this.accumulatedDelta = this.accumulatedDelta % pixelsPerStep;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.accumulatedDelta = 0;

    // Save the updated percentages to the server
    this.savePercentages();
  }

  startDrag(event: MouseEvent, index: number) {
    this.isDragging = true;
    this.startY = event.clientY;
    this.currentIndex = index;
  }

  private adjustPercentages(direction: 'up' | 'down', change: number) {
    const upperIndex = this.currentIndex;
    const lowerIndex = this.currentIndex + 1;

    const originalValues = this.cards.map((c) => c.percentage);

    let upperChange = direction === 'up' ? change : -change;
    let lowerChange = -upperChange;

    const newUpper = Math.max(5, originalValues[upperIndex] + upperChange);
    const newLower = Math.max(5, originalValues[lowerIndex] + lowerChange);

    const actualUpperChange = newUpper - originalValues[upperIndex];
    const actualLowerChange = newLower - originalValues[lowerIndex];

    let workingPercentages = [...originalValues];
    workingPercentages[upperIndex] += actualUpperChange;
    workingPercentages[lowerIndex] += actualLowerChange;

    workingPercentages = this.normalizePercentages(workingPercentages);

    workingPercentages.forEach((percentage, index) => {
      this.cards[index].percentage = percentage;
    });
  }

  private normalizePercentages(percentages: number[]): number[] {
    const total = percentages.reduce((a, b) => a + b, 0);
    let delta = total - 100;
    const normalized = [...percentages];

    while (delta !== 0) {
      if (delta > 0) {
        const candidates = normalized
          .map((p, i) => ({ index: i, value: p }))
          .filter((p) => p.value > 5)
          .sort((a, b) => b.value - a.value);

        if (candidates.length === 0) break;
        normalized[candidates[0].index] -= 5;
        delta -= 5;
      } else {
        const candidates = normalized
          .map((p, i) => ({ index: i, value: p }))
          .sort((a, b) => a.value - b.value);

        if (candidates.length === 0) break;
        normalized[candidates[0].index] += 5;
        delta += 5;
      }
    }

    return normalized;
  }

  private savePercentages() {
    if (!this.jobDescription) return;
    const jobDescriptionTasks = this.jobDescription.tasks;

    const taskPercentages = this.cards.map((card) => {
      const jdt = jobDescriptionTasks.find(
        (task) => task.jobTask.id === card.jobTask.id
      );
      return {
        taskId: jdt!.id,
        percentage: card.percentage,
      };
    });

    this.jobDescriptionsService
      .updateJobDescriptionPercentages(this.jobDescription.id, taskPercentages)
      .subscribe({
        next: (jobDescription) => {
          this.currentWorkspaceService.setCurrentJobDescription(jobDescription);
        },
        error: (err) => console.error('Error updating percentages:', err),
      });
  }

  selectCard(card: Card) {
    this.cardService.selectCard(card);
  }

  getPastelColor(currentIndex: number): string {
    return getNextPastelColor(currentIndex);
  }
}
