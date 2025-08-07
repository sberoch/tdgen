import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EnvironmentService } from './environment.service';

@Injectable({
  providedIn: 'root',
})
export class MiscService {
  private apiUrl: string;

  constructor(private http: HttpClient, private env: EnvironmentService) {
    this.apiUrl = `${this.env.apiUrl || '/'}api/misc`;
  }

  downloadInstructionManual(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/instructions`, {
      responseType: 'blob',
    });
  }
}
