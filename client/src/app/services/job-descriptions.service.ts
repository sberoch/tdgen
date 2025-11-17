import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { EnvironmentService } from './environment.service';
import { SseService, SseEvent } from './sse.service';
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

  constructor(
    private http: HttpClient,
    private env: EnvironmentService,
    private sseService: SseService
  ) {
    this.apiUrl = `${this.env.apiUrl || '/'}api/job-descriptions`;
    this.loadJobDescriptions();

    // Subscribe to lock events to update job description lock state
    this.sseService.lockEvents.subscribe((event) => {
      this.handleLockEvent(event);
    });

    // Subscribe to job description events from SSE
    this.sseService.jobDescriptionEvents.subscribe((event) => {
      this.handleJobDescriptionEvent(event);
    });
  }

  private handleLockEvent(event: SseEvent): void {
    if (event.data.entityType !== 'JobDescription') {
      return; // Not a job description lock
    }

    const descriptionId = event.data.entityId;
    const currentDescriptions = this.jobDescriptionsSubject.value;
    const descriptionIndex = currentDescriptions.findIndex(
      (d) => d.id === descriptionId
    );

    if (descriptionIndex === -1) {
      return; // Description not in current list
    }

    const updatedDescriptions = [...currentDescriptions];
    const description = { ...updatedDescriptions[descriptionIndex] };

    if (event.type === 'lock:acquired') {
      description.lockedById = event.data.lockedById;
      description.lockedAt = new Date(event.data.lockExpiry).toISOString();
      description.lockExpiry = new Date(event.data.lockExpiry).toISOString();
    } else if (event.type === 'lock:released' || event.type === 'lock:broken') {
      description.lockedById = undefined;
      description.lockedAt = undefined;
      description.lockExpiry = undefined;
    }

    updatedDescriptions[descriptionIndex] = description;
    this.jobDescriptionsSubject.next(updatedDescriptions);
  }

  private handleJobDescriptionEvent(event: SseEvent): void {
    const currentDescriptions = this.jobDescriptionsSubject.value;
    let updatedList: JobDescription[];

    switch (event.type) {
      case 'job-description:created':
        // Add new description to local list
        updatedList = [...currentDescriptions, event.data];
        break;

      case 'job-description:updated':
      case 'job-description:deleted':
      case 'job-description:restored':
        // Update existing description in local list
        updatedList = currentDescriptions.map((desc) =>
          desc.id === event.data.id ? event.data : desc
        );
        break;

      case 'job-description:permanent-deleted':
        // Remove from list completely
        updatedList = currentDescriptions.filter(
          (desc) => desc.id !== event.data.id
        );
        break;

      default:
        return;
    }

    // Sort by title alphabetically (case-sensitive)
    updatedList.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );
    this.jobDescriptionsSubject.next(updatedList);
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

  permanentDeleteJobDescription(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/permanent`);
  }

  restoreJobDescription(id: number): Observable<JobDescription> {
    return this.http.patch<JobDescription>(`${this.apiUrl}/${id}/restore`, {});
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
