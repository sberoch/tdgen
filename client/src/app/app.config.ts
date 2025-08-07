import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { RuntimeConfigService } from './services/runtime-config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    MatDialogModule,
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [RuntimeConfigService],
      useFactory: (cfg: RuntimeConfigService) => () => cfg.load(),
    },
  ],
};
