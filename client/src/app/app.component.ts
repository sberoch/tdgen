import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SseService } from './services/sse.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [RouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'client';

  constructor(
    private authService: AuthService,
    private sseService: SseService
  ) {}

  ngOnInit(): void {
    // Connect SSE when user is authenticated
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.sseService.connect();
      } else {
        this.sseService.disconnect();
      }
    });
  }

  ngOnDestroy(): void {
    this.sseService.disconnect();
  }
}
