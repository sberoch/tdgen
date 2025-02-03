import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private titleSubject = new BehaviorSubject<string>('');
  currentTitle = this.titleSubject.asObservable();

  updateTitle(newTitle: string) {
    this.titleSubject.next(newTitle);
  }
}
