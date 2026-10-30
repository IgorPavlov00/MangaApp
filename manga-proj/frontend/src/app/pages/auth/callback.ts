import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { AuthShell } from './auth-shell';

/** Where the confirmation email link lands. supabase-js reads the session from the URL. */
@Component({
  selector: 'app-auth-callback',
  imports: [RouterLink, AuthShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell heading="Confirming your email" glyph="歓">
      @if (error()) {
        <p class="callout error" style="margin-top: 24px">{{ error() }}</p>
        <p style="margin-top: 16px"><a class="link" routerLink="/login">Go to sign in</a></p>
      } @else {
        <p class="muted" style="margin-top: 24px">One moment…</p>
      }
    </app-auth-shell>
  `,
})
export default class AuthCallback {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Errors come back in the hash (implicit flow) or the query string.
    const params = new URLSearchParams(location.hash.slice(1) || location.search.slice(1));
    const description = params.get('error_description');

    this.auth.ready.then(() => {
      if (this.auth.user()) {
        this.toast.success(`Email confirmed. Welcome, ${this.auth.displayName()}!`);
        this.router.navigateByUrl('/library', { replaceUrl: true });
      } else {
        this.error.set(
          description
            ? `${description.replace(/\+/g, ' ')}. The link may have expired; try signing in or request a new one.`
            : 'This link is invalid or has already been used. Try signing in.',
        );
      }
    });
  }
}
