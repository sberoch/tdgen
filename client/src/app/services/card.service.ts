import { moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { CurrentWorkspaceService } from './current-workspace.service';
import { Card } from '../utils/card.utils';
import { JobTask } from '../types/job-tasks';
import { JobDescription } from '../types/job-descriptions';
import { JobDescriptionTask } from '../types/job-description-tasks';
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

  constructor(
    private http: HttpClient,
    private currentWorkspaceService: CurrentWorkspaceService
  ) {
    this.initializeCards();
    this.currentWorkspaceService.currentJobDescription.subscribe(
      (jobDescription) => {
        this.currentJobDescription = jobDescription;

        this.displayCardsSubject.next(
          jobDescription?.tasks.map((jdTask) => ({
            classification: jdTask.jobTask?.metadata?.['paymentGroup'] || '',
            jobTask: jdTask.jobTask,
            title: jdTask.jobTask?.title || '',
            text: jdTask.jobTask?.text || '',
            percentage: jdTask.percentage || 5,
            tags: jdTask.jobTask?.tags?.map((tag) => tag.name) || [],
          })) || []
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
        tags: task.tags.map((tag) => tag.name),
      }));
      this.cardsSubject.next(cards);
    });
  }

  private balanceArray(arr: number[]): number[] {
    const sumArray = (arr: number[]) =>
      arr.reduce((sum, curr) => sum + curr, 0);
    let maxAttempts = 100;

    while (sumArray(arr) !== 100 && maxAttempts > 0) {
      if (sumArray(arr) < 100) {
        const maxIndex = arr.indexOf(Math.max(...arr));
        arr[maxIndex] += 5;
      } else {
        const sortedIndices = arr
          .map((val, idx) => ({ val, idx }))
          .filter((item) => item.val > 5)
          .sort((a, b) => b.val - a.val);

        if (sortedIndices.length === 0) {
          throw new Error('No valid distribution possible');
        }

        arr[sortedIndices[0].idx] -= 5;
      }

      maxAttempts--;
    }

    if (maxAttempts === 0) {
      throw new Error('Could not balance array within reasonable attempts');
    }

    return arr;
  }

  private calculateAdjustedPercentages(
    newCount: number,
    existingPercentages: number[]
  ): number[] {
    if (newCount === 0) return [];
    if (newCount === 1) return [100];

    let result = [...existingPercentages];
    // Add parts by splitting the largest value
    if (newCount > existingPercentages.length) {
      const maxVal = Math.max(...result);
      const maxIndex = result.indexOf(maxVal);
      if (maxVal <= 5) {
        throw new Error('Cannot split values smaller than or equal to 5%');
      }
      const halfValue = Math.floor(maxVal / 2);
      const firstHalf = Math.floor(halfValue / 5) * 5;
      const secondHalf = maxVal - firstHalf;
      if (firstHalf < 5 || secondHalf < 5) {
        return this.balanceArray(
          result.concat(Array(newCount - result.length).fill(5))
        );
      }
      result.splice(maxIndex, 1);
      result.unshift(
        Math.min(firstHalf, secondHalf),
        Math.max(firstHalf, secondHalf)
      );
    }
    // Remove parts by merging with the next smaller value
    else if (newCount < existingPercentages.length) {
      const areAllDivisibleByFive = (arr: number[]) =>
        arr.every((num: number) => num % 5 === 0);
      while (result.length > newCount) {
        const smallest = Math.min(...result);
        const smallestIndex = result.indexOf(smallest);

        // Find the next smallest value
        let nextSmallest = Infinity;
        let nextSmallestIndex = -1;

        for (let i = 0; i < result.length; i++) {
          if (i !== smallestIndex && result[i] < nextSmallest) {
            nextSmallest = result[i];
            nextSmallestIndex = i;
          }
        }

        if (nextSmallestIndex === -1) {
          throw new Error('Cannot find valid merge target');
        }

        // Merge the values
        result[nextSmallestIndex] += result[smallestIndex];
        result.splice(smallestIndex, 1);

        // If the result is not divisible by 5, try balancing
        if (!areAllDivisibleByFive([result[nextSmallestIndex]])) {
          return this.balanceArray(result);
        }
      }
    }
    return result;
  }

  addToDisplay(card: Card, index: number) {
    const isDuplicate = this.currentJobDescription?.tasks.some(
      (existingCard) => existingCard.jobTask.id === card.jobTask.id
    );

    if (!isDuplicate) {
      // TODO: percentages in server
      const percentages = this.calculateAdjustedPercentages(
        this.currentJobDescription?.tasks.length || 0,
        this.currentJobDescription?.tasks.map((c) => c.percentage) || []
      );
      this.http
        .post<JobDescriptionTask>(`${this.apiUrl}/job-description-tasks`, {
          jobDescriptionId: this.currentJobDescription?.id,
          jobTaskId: card.jobTask.id,
          percentage: card.percentage,
          order: index,
        })
        .subscribe({
          next: (jdTask) => {
            const jobDescription = this.currentJobDescription!;
            jobDescription.tasks.push(jdTask);
            this.currentWorkspaceService.setCurrentJobDescription(
              jobDescription
            );
          },
          error: (error) => {
            console.error('Error adding job description task:', error);
          },
        });
    }
    this.selectedCardSubject.next(card);
  }

  removeFromDisplay(index: number) {
    // TODO: percentages in server
    const percentages = this.calculateAdjustedPercentages(
      this.currentJobDescription?.tasks.length || 0,
      this.currentJobDescription?.tasks.map((c) => c.percentage) || []
    );
    const jdTaskToDelete = this.currentJobDescription?.tasks[index];
    this.http
      .delete<JobDescriptionTask>(
        `${this.apiUrl}/job-description-tasks/${jdTaskToDelete?.id}`
      )
      .subscribe({
        next: () => {
          const jobDescription = this.currentJobDescription!;
          const newJdTasks = jobDescription.tasks.filter(
            (c) => c.jobTask.id !== jdTaskToDelete?.jobTask.id
          );
          jobDescription.tasks = newJdTasks;
          this.currentWorkspaceService.setCurrentJobDescription(jobDescription);
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
    this.displayCardsSubject.next(currentDisplay);
    this.selectedCardSubject.next(currentDisplay[currentIndex]);
  }

  moveCardToTop(index: number) {
    const currentDisplay = [...this.displayCardsSubject.value];
    moveItemInArray(currentDisplay, index, 0);
    this.displayCardsSubject.next(currentDisplay);
    this.selectedCardSubject.next(currentDisplay[0]);
  }

  moveCardToBottom(index: number) {
    const currentDisplay = [...this.displayCardsSubject.value];
    moveItemInArray(currentDisplay, index, currentDisplay.length - 1);
    this.displayCardsSubject.next(currentDisplay);
    this.selectedCardSubject.next(currentDisplay[currentDisplay.length - 1]);
  }

  selectCard(card: Card) {
    this.selectedCardSubject.next(card);
  }
}
