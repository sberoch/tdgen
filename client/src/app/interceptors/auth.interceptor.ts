import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DialogService } from '../services/dialog.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const dialogService = inject(DialogService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        dialogService.showSessionExpiredDialog();
      }
      return throwError(() => error);
    })
  );
};
