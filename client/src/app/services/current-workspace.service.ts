import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { JobDescription } from '../types/job-descriptions';
import { JobDescriptionsService } from './job-descriptions.service';

@Injectable({
  providedIn: 'root',
})
export class CurrentWorkspaceService {
  private currentJobDescriptionSubject =
    new BehaviorSubject<JobDescription | null>(null);
  currentJobDescription = this.currentJobDescriptionSubject.asObservable();

  constructor(private jobDescriptionsService: JobDescriptionsService) {}

  triggerJobDescriptionFetch(newCurrentJobDescription: JobDescription) {
    this.jobDescriptionsService
      .getJobDescriptionById(newCurrentJobDescription.id)
      .subscribe({
        next: (jobDescription) => {
          this.currentJobDescriptionSubject.next(jobDescription);
        },
        error: (error) => {
          console.error('Error fetching job description', error);
        },
      });
  }

  setCurrentJobDescription(newCurrentJobDescription: JobDescription) {
    this.currentJobDescriptionSubject.next(newCurrentJobDescription);
  }

  getCurrentJobDescriptionValue(): JobDescription | null {
    return this.currentJobDescriptionSubject.getValue();
  }

  clearCurrentJobDescription() {
    this.currentJobDescriptionSubject.next(null);
  }
}
