import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { JobTask } from '../types/job-tasks';

@Injectable({
  providedIn: 'root',
})
export class JobTasksService {
  private jobTasksSubject = new BehaviorSubject<JobTask[]>([]);
  private apiUrl = `${environment.apiUrl}api/job-tasks`;

  jobTasks$ = this.jobTasksSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadJobTasks();
  }

  private loadJobTasks() {
    this.http.get<JobTask[]>(this.apiUrl).subscribe((jobTasks) => {
      this.jobTasksSubject.next(jobTasks);
    });
  }

  getJobTasks(): Observable<JobTask[]> {
    return this.jobTasks$;
  }

  getJobTaskById(id: number): Observable<JobTask> {
    return this.http.get<JobTask>(`${this.apiUrl}/${id}`);
  }

  createJobTask(jobTask: Partial<JobTask>): Observable<JobTask> {
    return this.http.post<JobTask>(this.apiUrl, jobTask);
  }

  updateJobTask(id: number, jobTask: Partial<JobTask>): Observable<JobTask> {
    return this.http.put<JobTask>(`${this.apiUrl}/${id}`, jobTask);
  }

  deleteJobTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
