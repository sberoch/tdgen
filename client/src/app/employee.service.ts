import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Employee } from './employee';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  employees$ = signal<Employee[]>([]);
  employee$ = signal<Employee>({} as Employee);

  constructor(private httpClient: HttpClient) { }

  private refreshEmployees() {
    this.httpClient.get<Employee[]>(`${environment.apiUrl}employees`)
      .subscribe(employees => {
        this.employees$.set(employees);
      });
  }

  getEmployees() {
    this.refreshEmployees();
    return this.employees$();
  }

  getEmployee(id: string) {
    this.httpClient.get<Employee>(`${environment.apiUrl}employees/${id}`).subscribe(employee => {
      this.employee$.set(employee);
      return this.employee$();
    });
  }

  createEmployee(employee: Employee) {
    return this.httpClient.post(`${environment.apiUrl}employees`, employee, { responseType: 'text' });
  }

  updateEmployee(id: string, employee: Employee) {
    return this.httpClient.put(`${environment.apiUrl}employees/${id}`, employee, { responseType: 'text' });
  }

  deleteEmployee(id: string) {
    return this.httpClient.delete(`${environment.apiUrl}employees/${id}`, { responseType: 'text' });
  }
}
