import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DeniedComponent } from './pages/denied/denied.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'denied', component: DeniedComponent },
];
