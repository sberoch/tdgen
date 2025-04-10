import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateJobDescription } from '../../types/job-descriptions';
@Component({
  selector: 'app-title-activity-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './title-activity-dialog.component.html',
  styleUrls: ['./title-activity-dialog.component.css'],
})
export class TitleActivityDialogComponent {
  title: string = '';
  errorMessage: string = '';

  constructor(
    private dialogRef: MatDialogRef<TitleActivityDialogComponent>,
    private http: HttpClient
  ) {}

  async onAccept() {
    this.errorMessage = '';
    if (this.title.trim()) {
      const exists = await firstValueFrom(
        this.http.get<boolean>(
          `${
            environment.apiUrl
          }api/job-descriptions/exists?title=${this.title.trim()}`
        )
      );

      if (!exists) {
        await firstValueFrom(
          this.http.post<CreateJobDescription>(
            `${environment.apiUrl}api/job-descriptions`,
            {
              title: this.title.trim(),
              metadata: {},
              tags: [],
              formFields: {},
            }
          )
        );
        this.dialogRef.close(this.title.trim());
      } else {
        this.errorMessage =
          'Dieser Titel existiert bereits. Bitte wählen sie einen anderen Titel.';
        console.log('Title already exists');
      }
    } else {
      this.errorMessage = 'Das Feld darf nicht leer sein.';
    }
  }
}
