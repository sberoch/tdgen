import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateJobTask,
  JobTask,
  UpdateJobTask,
  JobTasksListResponse,
} from '../types/job-tasks';
import { tap } from 'rxjs/operators';

export interface JobTaskFilter {
  title?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  includeDeleted?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root',
})
export class JobTasksService {
  private jobTasksSubject = new BehaviorSubject<JobTask[]>([]);
  private apiUrl = `${environment.apiUrl}api/job-tasks`;

  jobTasks$ = this.jobTasksSubject.asObservable();

  constructor(private http: HttpClient) {}

  private loadJobTasks(
    filter?: JobTaskFilter
  ): Observable<JobTasksListResponse> {
    const params = this.buildWhereClause(filter);
    return this.http.get<JobTasksListResponse>(this.apiUrl, { params }).pipe(
      tap((jobTasksListResponse) => {
        this.jobTasksSubject.next(jobTasksListResponse.tasks);
      })
    );
  }

  getJobTasks(filter?: JobTaskFilter): Observable<JobTasksListResponse> {
    return this.loadJobTasks(filter);
  }

  getJobTaskById(id: number): Observable<JobTask> {
    return this.http.get<JobTask>(`${this.apiUrl}/${id}`);
  }

  createJobTask(jobTask: CreateJobTask): Observable<JobTask> {
    return this.http.post<JobTask>(this.apiUrl, jobTask);
  }

  updateJobTask(id: number, jobTask: UpdateJobTask): Observable<JobTask> {
    return this.http.patch<JobTask>(`${this.apiUrl}/${id}`, jobTask);
  }

  deleteJobTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  existsByTitle(title: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists?title=${title}`);
  }

  getAffectedJobDescriptionsCount(id: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${id}/affected-job-descriptions-count`);
  }

  private buildWhereClause(filter?: JobTaskFilter): HttpParams {
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
