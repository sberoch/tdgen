import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EnvironmentService } from './environment.service';
import { SseService, SseEvent } from './sse.service';
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
  createdById?: string;
}

@Injectable({
  providedIn: 'root',
})
export class JobTasksService {
  private jobTasksSubject = new BehaviorSubject<JobTask[]>([]);
  private apiUrl: string;

  jobTasks$ = this.jobTasksSubject.asObservable();

  constructor(
    private http: HttpClient,
    private env: EnvironmentService,
    private sseService: SseService
  ) {
    this.apiUrl = `${this.env.apiUrl || '/'}api/job-tasks`;

    // Subscribe to lock events to update job task lock state
    this.sseService.lockEvents.subscribe((event) => {
      this.handleLockEvent(event);
    });

    // Subscribe to job task events from SSE
    this.sseService.jobTaskEvents.subscribe((event) => {
      this.handleJobTaskEvent(event);
    });
  }

  private handleLockEvent(event: SseEvent): void {
    if (event.data.entityType !== 'JobTask') {
      return; // Not a job task lock
    }

    const taskId = event.data.entityId;
    const currentTasks = this.jobTasksSubject.value;
    const taskIndex = currentTasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return; // Task not in current list
    }

    const updatedTasks = [...currentTasks];
    const task = { ...updatedTasks[taskIndex] };

    if (event.type === 'lock:acquired') {
      task.lockedById = event.data.lockedById;
      task.lockedAt = new Date(event.data.lockExpiry).toISOString();
      task.lockExpiry = new Date(event.data.lockExpiry).toISOString();
    } else if (event.type === 'lock:released' || event.type === 'lock:broken') {
      task.lockedById = undefined;
      task.lockedAt = undefined;
      task.lockExpiry = undefined;
    }

    updatedTasks[taskIndex] = task;
    this.jobTasksSubject.next(updatedTasks);
  }

  private handleJobTaskEvent(event: SseEvent): void {
    const currentTasks = this.jobTasksSubject.value;
    let updatedList: JobTask[];

    switch (event.type) {
      case 'job-task:created':
        // Add new task to local list
        updatedList = [...currentTasks, event.data];
        break;

      case 'job-task:updated':
      case 'job-task:deleted':
      case 'job-task:restored':
        // Update existing task in local list
        updatedList = currentTasks.map((task) =>
          task.id === event.data.id ? event.data : task
        );
        break;

      case 'job-task:permanent-deleted':
        // Remove from list completely
        updatedList = currentTasks.filter((task) => task.id !== event.data.id);
        break;

      default:
        return;
    }

    // Sort by title alphabetically (case-sensitive)
    updatedList.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );
    this.jobTasksSubject.next(updatedList);
  }

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

  permanentDeleteJobTaskWithCleanup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/permanent`);
  }

  restoreJobTask(id: number): Observable<JobTask> {
    return this.http.patch<JobTask>(`${this.apiUrl}/${id}/restore`, {});
  }

  existsByTitle(title: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists?title=${title}`);
  }

  getAffectedJobDescriptionsCount(id: number): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/${id}/affected-job-descriptions-count`
    );
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

    if (filter?.createdById) {
      params = params.set('createdById', filter.createdById);
    }

    return params;
  }
}
