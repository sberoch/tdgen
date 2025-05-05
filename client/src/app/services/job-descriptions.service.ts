import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateJobDescription,
  JobDescription,
  UpdateJobDescription,
} from '../types/job-descriptions';

export interface JobDescriptionFilter {
  title?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  includeDeleted?: boolean;
  search?: string;
}

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

  private loadJobDescriptions(filter?: JobDescriptionFilter) {
    let params = this.buildWhereClause(filter);
    this.http
      .get<JobDescription[]>(this.apiUrl, { params })
      .subscribe((jobDescriptions) => {
        this.jobDescriptionsSubject.next(jobDescriptions);
      });
  }

  getJobDescriptions(
    filter?: JobDescriptionFilter
  ): Observable<JobDescription[]> {
    this.loadJobDescriptions(filter);
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
    jobDescription: UpdateJobDescription
  ): Observable<JobDescription> {
    return this.http.patch<JobDescription>(
      `${this.apiUrl}/${id}`,
      jobDescription
    );
  }

  deleteJobDescription(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateJobDescriptionPercentages(
    id: number,
    taskPercentages: { taskId: number; percentage: number }[]
  ): Observable<JobDescription> {
    return this.http.patch<JobDescription>(`${this.apiUrl}/${id}/percentages`, {
      taskPercentages,
    });
  }

  private buildWhereClause(filter?: JobDescriptionFilter): HttpParams {
    let params = new HttpParams();

    if (filter?.search) {
      params = params.set('search', filter.search);
    } else {
      if (filter?.title) {
        params = params.set('title', filter.title);
      }

      if (filter?.tags?.length) {
        params = params.set('tags', filter.tags.join(','));
      }
    }
    if (filter?.metadata) {
      params = params.set('metadata', JSON.stringify(filter.metadata));
    }

    if (filter?.includeDeleted) {
      params = params.set('includeDeleted', 'true');
    }

    return params;
  }
}
