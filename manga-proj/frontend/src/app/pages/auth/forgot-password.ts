import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Icon } from '../../shared/icon';
import { AuthShell } from './auth-shell';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, Icon, AuthShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell heading="Reset your password" subheading="We'll email you a link to choose a new one." glyph="鍵">
      @if (sent()) {
        <div class="done" role="status">
          <app-icon name="mail" />
          <strong>Check your inbox</strong>
          <p class="muted">If an account exists for that address, a reset link is on its way.</p>
          <a class="link" routerLink="/login">Back to sign in</a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @if (error()) {
            <p class="callout error" role="alert">{{ error() }}</p>
          }
          <div class="field">
            <label for="email">Email</label>
            <input id="email" class="input" type="email" formControlName="email" autocomplete="email" />
          </div>
          <button class="btn btn-primary btn-block" type="submit" [disabled]="busy() || !auth.configured">
            @if (busy()) {
              <span class="spinner"></span>
            }
            Send reset link
          </button>
        </form>
        <p class="alt muted"><a class="link" routerLink="/login">Back to sign in</a></p>
      }
    </app-auth-shell>
  `,
  styleUrl: './auth-form.scss',
})
export default class ForgotPassword {
  protected readonly auth = inject(AuthService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly busy = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    const result = await this.auth.sendPasswordReset(this.form.getRawValue().email.trim());
    this.busy.set(false);
    if (result.error) this.error.set(result.error);
    else this.sent.set(true);
  }
}
