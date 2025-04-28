import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateJobDescriptionTask,
  JobDescriptionTask,
  UpdateJobDescriptionTask,
} from '../types/job-description-tasks';
import { tap } from 'rxjs/operators';

export interface JobDescriptionTaskFilter {
  jobDescriptionId?: number;
  jobTaskId?: number;
  includeDeleted?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class JobDescriptionTasksService {
  private jobDescriptionTasksSubject = new BehaviorSubject<
    JobDescriptionTask[]
  >([]);
  private apiUrl = `${environment.apiUrl}job-description-tasks`;

  jobDescriptionTasks$ = this.jobDescriptionTasksSubject.asObservable();

  constructor(private http: HttpClient) {}

  private loadJobDescriptionTasks(
    filter?: JobDescriptionTaskFilter
  ): Observable<JobDescriptionTask[]> {
    const params = this.buildWhereClause(filter);
    return this.http.get<JobDescriptionTask[]>(this.apiUrl, { params }).pipe(
      tap((tasks) => {
        this.jobDescriptionTasksSubject.next(tasks);
      })
    );
  }

  getJobDescriptionTasks(
    filter?: JobDescriptionTaskFilter
  ): Observable<JobDescriptionTask[]> {
    return this.loadJobDescriptionTasks(filter);
  }

  getJobDescriptionTaskById(id: number): Observable<JobDescriptionTask> {
    return this.http.get<JobDescriptionTask>(`${this.apiUrl}/${id}`);
  }

  getTasksByJobDescriptionId(
    jobDescriptionId: number
  ): Observable<JobDescriptionTask[]> {
    return this.loadJobDescriptionTasks({ jobDescriptionId });
  }

  getJobDescriptionsByTaskId(
    jobTaskId: number
  ): Observable<JobDescriptionTask[]> {
    return this.loadJobDescriptionTasks({ jobTaskId });
  }

  createJobDescriptionTask(
    task: CreateJobDescriptionTask
  ): Observable<JobDescriptionTask> {
    return this.http.post<JobDescriptionTask>(this.apiUrl, task).pipe(
      tap(() => {
        // Refresh the list after creating a new association
        this.loadJobDescriptionTasks().subscribe();
      })
    );
  }

  updateJobDescriptionTask(
    id: number,
    task: UpdateJobDescriptionTask
  ): Observable<JobDescriptionTask> {
    return this.http.put<JobDescriptionTask>(`${this.apiUrl}/${id}`, task).pipe(
      tap(() => {
        // Refresh the list after updating
        this.loadJobDescriptionTasks().subscribe();
      })
    );
  }

  deleteJobDescriptionTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Refresh the list after deleting
        this.loadJobDescriptionTasks().subscribe();
      })
    );
  }

  private buildWhereClause(filter?: JobDescriptionTaskFilter): HttpParams {
    let params = new HttpParams();

    if (filter?.jobDescriptionId !== undefined) {
      params = params.set(
        'jobDescriptionId',
        filter.jobDescriptionId.toString()
      );
    }

    if (filter?.jobTaskId !== undefined) {
      params = params.set('jobTaskId', filter.jobTaskId.toString());
    }

    if (filter?.includeDeleted) {
      params = params.set('includeDeleted', 'true');
    }

    return params;
  }
}
