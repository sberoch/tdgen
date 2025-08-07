import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { EnvironmentService } from './environment.service';
import {
  CreateJobDescription,
  JobDescription,
  JobDescriptionsListResponse,
  UpdateJobDescription,
} from '../types/job-descriptions';

export interface JobDescriptionFilter {
  title?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  includeDeleted?: boolean;
  search?: string;
  createdById?: string;
}

@Injectable({
  providedIn: 'root',
})
export class JobDescriptionsService {
  private jobDescriptionsSubject = new BehaviorSubject<JobDescription[]>([]);
  private apiUrl: string;

  jobDescriptions$ = this.jobDescriptionsSubject.asObservable();

  constructor(private http: HttpClient, private env: EnvironmentService) {
    this.apiUrl = `${this.env.apiUrl || '/'}api/job-descriptions`;
    this.loadJobDescriptions();
  }

  private loadJobDescriptions(
    filter?: JobDescriptionFilter
  ): Observable<JobDescriptionsListResponse> {
    let params = this.buildWhereClause(filter);
    return this.http
      .get<JobDescriptionsListResponse>(this.apiUrl, { params })
      .pipe(
        tap((jobDescriptionsListResponse) => {
          this.jobDescriptionsSubject.next(
            jobDescriptionsListResponse.jobDescriptions
          );
        })
      );
  }

  getJobDescriptions(
    filter?: JobDescriptionFilter
  ): Observable<JobDescriptionsListResponse> {
    return this.loadJobDescriptions(filter);
  }

  getJobDescriptionById(id: number): Observable<JobDescription> {
    return this.http.get<JobDescription>(`${this.apiUrl}/${id}`);
  }

  existsByTitle(title: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists?title=${title}`);
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

  downloadJobDescriptionPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob',
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

    if (filter?.createdById) {
      params = params.set('createdById', filter.createdById);
    }

    return params;
  }
}
