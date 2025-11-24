import { moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { JobDescription } from '../types/job-descriptions';
import { JobTasksListResponse } from '../types/job-tasks';
import { Card } from '../utils/card.utils';
import { CurrentWorkspaceService } from './current-workspace.service';
import { EnvironmentService } from './environment.service';
import { SseService, SseEvent } from './sse.service';

@Injectable({
  providedIn: 'root',
})
export class CardService {
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  private displayCardsSubject = new BehaviorSubject<Card[]>([]);
  private selectedCardSubject = new BehaviorSubject<Card | null>(null);
  private apiUrl: string;
  currentJobDescription: JobDescription | null = null;

  cards$ = this.cardsSubject.asObservable();
  displayCards$ = this.displayCardsSubject.asObservable();
  selectedCard$ = this.selectedCardSubject.asObservable();
  allBacklogCards: Card[] = [];

  constructor(
    private http: HttpClient,
    private currentWorkspaceService: CurrentWorkspaceService,
    private env: EnvironmentService,
    private sseService: SseService
  ) {
    this.apiUrl = `${this.env.apiUrl || '/'}api`;
    this.initializeCards();
    this.currentWorkspaceService.currentJobDescription.subscribe(
      (jobDescription) => {
        this.currentJobDescription = jobDescription;
        this.updateCardsSubjects();
      }
    );

    // Subscribe to lock events for real-time lock status updates
    this.sseService.lockEvents.subscribe((event) => {
      this.handleLockEvent(event);
    });

    // Subscribe to job task events for real-time updates
    this.sseService.jobTaskEvents.subscribe((event) => {
      this.handleJobTaskEvent(event);
    });

    // Subscribe to job-description-task events for real-time updates
    this.sseService.jobDescriptionTaskEvents.subscribe((event) => {
      this.handleJobDescriptionTaskEvent(event);
    });
  }

  initializeCards() {
    this.http
      .get<JobTasksListResponse>(`${this.apiUrl}/job-tasks`)
      .subscribe((jobTasksListResponse) => {
        const cards = jobTasksListResponse.tasks.map((task) => ({
          classification: task.metadata?.['paymentGroup'] || '',
          jobTask: task,
          title: task.title,
          text: task.text,
          percentage: 5,
          order: 0,
          tags: task.tags.map((tag) => tag.name),
        }));
        this.allBacklogCards = cards;

        // Apply current job description filtering
        this.updateCardsSubjects();
      });
  }

  private updateCardsSubjects() {
    // Update backlog cards (filtered to exclude those in current job description)
    this.cardsSubject.next(
      this.allBacklogCards.filter(
        (card) =>
          !(this.currentJobDescription?.tasks || []).some(
            (jdTask) => jdTask.jobTask.id === card.jobTask.id
          )
      )
    );

    // Update display cards (from current job description)
    this.displayCardsSubject.next(
      (this.currentJobDescription?.tasks || [])
        .map((jdTask) => ({
          classification: jdTask.jobTask?.metadata?.['paymentGroup'] || '',
          jobTask: jdTask.jobTask,
          title: jdTask.jobTask?.title || '',
          text: jdTask.jobTask?.text || '',
          percentage: jdTask.percentage || 5,
          order: jdTask.order || 0,
          tags: jdTask.jobTask?.tags?.map((tag) => tag.name) || [],
        }))
        .sort((a, b) => a.order - b.order)
    );
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

  private handleLockEvent(event: SseEvent): void {
    if (event.data.entityType !== 'JobTask') {
      return; // Not a job task lock
    }

    const taskId = event.data.entityId;

    // Update backlog cards
    const updatedBacklogCards = this.allBacklogCards.map((card) => {
      if (card.jobTask.id === taskId) {
        const updatedCard = { ...card };
        updatedCard.jobTask = { ...card.jobTask };

        if (event.type === 'lock:acquired') {
          updatedCard.jobTask.lockedById = event.data.lockedById;
          updatedCard.jobTask.lockedAt = new Date(event.data.lockExpiry).toISOString();
          updatedCard.jobTask.lockExpiry = new Date(event.data.lockExpiry).toISOString();
        } else if (event.type === 'lock:released' || event.type === 'lock:broken') {
          updatedCard.jobTask.lockedById = undefined;
          updatedCard.jobTask.lockedAt = undefined;
          updatedCard.jobTask.lockExpiry = undefined;
        }

        return updatedCard;
      }
      return card;
    });

    this.allBacklogCards = updatedBacklogCards;

    // Update display cards through CurrentWorkspaceService
    if (this.currentJobDescription) {
      const updatedJobDescription = { ...this.currentJobDescription };
      updatedJobDescription.tasks = updatedJobDescription.tasks.map((jdTask) => {
        if (jdTask.jobTask.id === taskId) {
          const updatedJdTask = { ...jdTask };
          updatedJdTask.jobTask = { ...jdTask.jobTask };

          if (event.type === 'lock:acquired') {
            updatedJdTask.jobTask.lockedById = event.data.lockedById;
            updatedJdTask.jobTask.lockedAt = new Date(event.data.lockExpiry).toISOString();
            updatedJdTask.jobTask.lockExpiry = new Date(event.data.lockExpiry).toISOString();
          } else if (event.type === 'lock:released' || event.type === 'lock:broken') {
            updatedJdTask.jobTask.lockedById = undefined;
            updatedJdTask.jobTask.lockedAt = undefined;
            updatedJdTask.jobTask.lockExpiry = undefined;
          }

          return updatedJdTask;
        }
        return jdTask;
      });

      this.currentWorkspaceService.setCurrentJobDescription(updatedJobDescription);
    }

    // Refresh the cards subjects
    this.updateCardsSubjects();
  }

  private handleJobTaskEvent(event: SseEvent): void {
    switch (event.type) {
      case 'job-task:created':
        // Add new task to backlog
        const newCard: Card = {
          classification: event.data.metadata?.['paymentGroup'] || '',
          jobTask: event.data,
          title: event.data.title,
          text: event.data.text,
          percentage: 5,
          order: 0,
          tags: event.data.tags?.map((tag: any) => tag.name) || [],
        };
        this.allBacklogCards = [...this.allBacklogCards, newCard];
        break;

      case 'job-task:updated':
        // Update task in both backlog and display cards
        this.allBacklogCards = this.allBacklogCards.map((card) =>
          card.jobTask.id === event.data.id
            ? {
                ...card,
                classification: event.data.metadata?.['paymentGroup'] || '',
                jobTask: event.data,
                title: event.data.title,
                text: event.data.text,
                tags: event.data.tags?.map((tag: any) => tag.name) || [],
              }
            : card
        );

        // Update in current job description if present
        if (this.currentJobDescription) {
          const updatedJobDescription = { ...this.currentJobDescription };
          updatedJobDescription.tasks = updatedJobDescription.tasks.map((jdTask) =>
            jdTask.jobTask.id === event.data.id
              ? {
                  ...jdTask,
                  jobTask: event.data,
                }
              : jdTask
          );
          this.currentWorkspaceService.setCurrentJobDescription(updatedJobDescription);
        }
        break;

      case 'job-task:deleted':
      case 'job-task:restored':
        // Update task deleted/restored status
        this.allBacklogCards = this.allBacklogCards.map((card) =>
          card.jobTask.id === event.data.id
            ? {
                ...card,
                jobTask: { ...card.jobTask, deletedAt: event.data.deletedAt },
              }
            : card
        );

        // Update in current job description if present
        if (this.currentJobDescription) {
          const updatedJobDescription = { ...this.currentJobDescription };
          updatedJobDescription.tasks = updatedJobDescription.tasks.map((jdTask) =>
            jdTask.jobTask.id === event.data.id
              ? {
                  ...jdTask,
                  jobTask: { ...jdTask.jobTask, deletedAt: event.data.deletedAt },
                }
              : jdTask
          );
          this.currentWorkspaceService.setCurrentJobDescription(updatedJobDescription);
        }
        break;

      case 'job-task:permanent-deleted':
        // Remove from backlog completely
        this.allBacklogCards = this.allBacklogCards.filter(
          (card) => card.jobTask.id !== event.data.id
        );
        break;
    }

    this.updateCardsSubjects();
  }

  private handleJobDescriptionTaskEvent(event: SseEvent): void {
    // Only handle events for the current job description
    if (!this.currentJobDescription) {
      return;
    }

    const eventJobDescriptionId = event.data.jobDescriptionId;
    if (eventJobDescriptionId !== this.currentJobDescription.id) {
      return; // Event is for a different job description
    }

    switch (event.type) {
      case 'job-description-task:created':
      case 'job-description-task:updated':
      case 'job-description-task:deleted':
      case 'job-description-task:reordered':
      case 'job-description-task:percentage-changed':
        // Update the entire job description from the event data
        if (event.data.jobDescription) {
          this.currentWorkspaceService.setCurrentJobDescription(event.data.jobDescription);
        }
        break;
    }
  }
}
