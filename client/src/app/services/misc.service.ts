import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MiscService {
  private apiUrl = `${environment.apiUrl}api/misc`;

  constructor(private http: HttpClient) {}

  downloadInstructionManual(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/instructions`, {
      responseType: 'blob',
    });
  }
}
