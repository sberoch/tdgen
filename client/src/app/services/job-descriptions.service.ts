import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateJobDescription,
  JobDescription,
} from '../types/job-descriptions';

@Injectable({
  providedIn: 'root',
})
export class JobDescriptionsService {
  private jobDescriptionsSubject = new BehaviorSubject<JobDescription[]>([]);
  private apiUrl = `${environment.apiUrl}api/job-descriptions`;

  jobDescriptions$ = this.jobDescriptionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadJobDescriptions();
  }

  private loadJobDescriptions() {
    this.http
      .get<JobDescription[]>(this.apiUrl)
      .subscribe((jobDescriptions) => {
        this.jobDescriptionsSubject.next(jobDescriptions);
      });
  }

  getJobDescriptions(): Observable<JobDescription[]> {
    return this.jobDescriptions$;
  }

  getJobDescriptionById(id: number): Observable<JobDescription> {
    return this.http.get<JobDescription>(`${this.apiUrl}/${id}`);
  }

  createJobDescription(
    jobDescription: CreateJobDescription
  ): Observable<JobDescription> {
    return this.http.post<JobDescription>(this.apiUrl, jobDescription);
  }

  updateJobDescription(
    id: number,
    jobDescription: Partial<JobDescription>
  ): Observable<JobDescription> {
    return this.http.put<JobDescription>(
      `${this.apiUrl}/${id}`,
      jobDescription
    );
  }

  deleteJobDescription(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
