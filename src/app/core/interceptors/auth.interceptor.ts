import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Paths that should NOT trigger a refresh on 401/403 */
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

function addBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthPath = AUTH_PATHS.some((p) => req.url.includes(p));

  // Attach bearer token if we have one and it's not a public auth call
  const token = authService.getAccessToken();
  const outgoing = !isAuthPath && token ? addBearer(req, token) : req;

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      // Gateway returns 401/403 with an empty body — handle both
      if ((err.status === 401 || err.status === 403) && !isAuthPath) {
        // Attempt a token refresh, then retry the original request once
        return authService.refresh().pipe(
          switchMap((res) => {
            return next(addBearer(req, res.accessToken));
          }),
          catchError(() => {
            // Refresh failed — force logout
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => err);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
