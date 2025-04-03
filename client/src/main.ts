import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

(window as any).ISDEVENV = environment.isDevEnv;

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
