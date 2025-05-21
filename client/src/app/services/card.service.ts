import { moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { JobDescription } from '../types/job-descriptions';
import { JobTask } from '../types/job-tasks';
import { Card } from '../utils/card.utils';
import { CurrentWorkspaceService } from './current-workspace.service';

@Injectable({
  providedIn: 'root',
})
export class CardService {
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  private displayCardsSubject = new BehaviorSubject<Card[]>([]);
  private selectedCardSubject = new BehaviorSubject<Card | null>(null);
  private apiUrl = `${environment.apiUrl}api`;
  currentJobDescription: JobDescription | null = null;

  cards$ = this.cardsSubject.asObservable();
  displayCards$ = this.displayCardsSubject.asObservable();
  selectedCard$ = this.selectedCardSubject.asObservable();
  allBacklogCards: Card[] = [];

  constructor(
    private http: HttpClient,
    private currentWorkspaceService: CurrentWorkspaceService
  ) {
    this.initializeCards();
    this.currentWorkspaceService.currentJobDescription.subscribe(
      (jobDescription) => {
        this.currentJobDescription = jobDescription;

        this.cardsSubject.next(
          this.allBacklogCards.filter(
            (card) =>
              !jobDescription?.tasks.some(
                (jdTask) => jdTask.jobTask.id === card.jobTask.id
              )
          )
        );

        this.displayCardsSubject.next(
          jobDescription?.tasks
            .map((jdTask) => ({
              classification: jdTask.jobTask?.metadata?.['paymentGroup'] || '',
              jobTask: jdTask.jobTask,
              title: jdTask.jobTask?.title || '',
              text: jdTask.jobTask?.text || '',
              percentage: jdTask.percentage || 5,
              order: jdTask.order || 0,
              tags: jdTask.jobTask?.tags?.map((tag) => tag.name) || [],
            }))
            .sort((a, b) => a.order - b.order) || []
        );
      }
    );
  }

  initializeCards() {
    this.http.get<JobTask[]>(`${this.apiUrl}/job-tasks`).subscribe((tasks) => {
      const cards = tasks.map((task) => ({
        classification: task.metadata?.['paymentGroup'] || '',
        jobTask: task,
        title: task.title,
        text: task.text,
        percentage: 5,
        order: 0,
        tags: task.tags.map((tag) => tag.name),
      }));
      this.cardsSubject.next(cards);
      this.allBacklogCards = cards;
    });
  }

  addToDisplay(card?: Card, index?: number) {
    if (!card) return;
    const isDuplicate = this.currentJobDescription?.tasks.some(
      (existingCard) => existingCard.jobTask.id === card.jobTask.id
    );
    if (!isDuplicate) {
      this.http
        .post<JobDescription>(`${this.apiUrl}/job-description-tasks`, {
          jobDescriptionId: this.currentJobDescription?.id,
          jobTaskId: card.jobTask.id,
          percentage: card.percentage,
          order: index,
        })
        .subscribe({
          next: (jd) => {
            this.currentWorkspaceService.setCurrentJobDescription(jd);
          },
          error: (error) => {
            console.error('Error adding job description task:', error);
          },
        });
    }
    this.selectedCardSubject.next(card);
  }

  removeFromDisplay(card?: Card) {
    if (!card) return;
    const jdTaskToDelete = this.currentJobDescription?.tasks.find(
      (task) => task.jobTask.id === card.jobTask.id
    );
    this.http
      .delete<JobDescription>(
        `${this.apiUrl}/job-description-tasks/${jdTaskToDelete?.id}`
      )
      .subscribe({
        next: (jd) => {
          this.currentWorkspaceService.setCurrentJobDescription(jd);
        },
        error: (error) => {
          console.error('Error deleting job description task:', error);
        },
      });
    this.selectedCardSubject.next(null);
  }

  moveInDisplay(previousIndex: number, currentIndex: number) {
    const currentDisplay = [...this.displayCardsSubject.value];
    moveItemInArray(currentDisplay, previousIndex, currentIndex);

    const movedCard = currentDisplay[currentIndex];
    if (!movedCard) return;

    const jdTask = this.currentJobDescription?.tasks.find(
      (task) => task.jobTask.id === movedCard.jobTask.id
    );

    if (jdTask) {
      this.http
        .patch<JobDescription>(
          `${this.apiUrl}/job-description-tasks/${jdTask.id}`,
          {
            order: currentIndex,
          }
        )
        .subscribe({
          next: (jd) => {
            this.currentWorkspaceService.setCurrentJobDescription(jd);
          },
          error: (error) => {
            console.error('Error updating task order:', error);
          },
        });
    }

    this.selectedCardSubject.next(currentDisplay[currentIndex]);
  }

  moveCardToTop(index: number) {
    const currentDisplay = [...this.displayCardsSubject.value];
    moveItemInArray(currentDisplay, index, 0);

    const movedCard = currentDisplay[0];
    if (!movedCard) return;

    const jdTask = this.currentJobDescription?.tasks.find(
      (task) => task.jobTask.id === movedCard.jobTask.id
    );

    if (jdTask) {
      this.http
        .patch<JobDescription>(
          `${this.apiUrl}/job-description-tasks/${jdTask.id}`,
          {
            order: 0,
          }
        )
        .subscribe({
          next: (jd) => {
            this.currentWorkspaceService.setCurrentJobDescription(jd);
          },
          error: (error) => {
            console.error('Error updating task order:', error);
          },
        });
    }

    this.selectedCardSubject.next(currentDisplay[0]);
  }

  moveCardToBottom(index: number) {
    const currentDisplay = [...this.displayCardsSubject.value];
    const lastIndex = currentDisplay.length - 1;
    moveItemInArray(currentDisplay, index, lastIndex);

    const movedCard = currentDisplay[lastIndex];
    if (!movedCard) return;

    const jdTask = this.currentJobDescription?.tasks.find(
      (task) => task.jobTask.id === movedCard.jobTask.id
    );

    if (jdTask) {
      this.http
        .patch<JobDescription>(
          `${this.apiUrl}/job-description-tasks/${jdTask.id}`,
          {
            order: lastIndex,
          }
        )
        .subscribe({
          next: (jd) => {
            this.currentWorkspaceService.setCurrentJobDescription(jd);
          },
          error: (error) => {
            console.error('Error updating task order:', error);
          },
        });
    }

    this.selectedCardSubject.next(currentDisplay[lastIndex]);
  }

  selectCard(card: Card) {
    this.selectedCardSubject.next(card);
  }
}
