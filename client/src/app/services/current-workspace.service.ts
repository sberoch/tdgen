import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { JobDescription } from '../types/job-descriptions';

@Injectable({
  providedIn: 'root',
})
export class CurrentWorkspaceService {
  private currentJobDescriptionSubject =
    new BehaviorSubject<JobDescription | null>(null);
  currentJobDescription = this.currentJobDescriptionSubject.asObservable();

  setCurrentJobDescription(newCurrentJobDescription: JobDescription) {
    this.currentJobDescriptionSubject.next(newCurrentJobDescription);
  }

  clearCurrentJobDescription() {
    this.currentJobDescriptionSubject.next(null);
  }
}
