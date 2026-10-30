import { HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/** Tracks API calls that are taking unusually long, e.g. while a free-tier server wakes up. */
@Injectable({ providedIn: 'root' })
export class ApiStatus {
  private readonly slowRequests = signal(0);
  readonly waking = computed(() => this.slowRequests() > 0);

  slowStarted(): void {
    this.slowRequests.update((n) => n + 1);
  }

  slowEnded(): void {
    this.slowRequests.update((n) => Math.max(0, n - 1));
  }
}

const SLOW_AFTER_MS = 3500;

/** Adds the Supabase access token to requests for our Spring API (and only those). */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const auth = inject(AuthService);
  const status = inject(ApiStatus);

  return from(auth.accessToken()).pipe(
    switchMap((token) => {
      const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
      let slow = false;
      const timer = setTimeout(() => {
        slow = true;
        status.slowStarted();
      }, SLOW_AFTER_MS);
      return next(authed).pipe(
        finalize(() => {
          clearTimeout(timer);
          if (slow) status.slowEnded();
        }),
      );
    }),
  );
};
