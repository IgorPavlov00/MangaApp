import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { AuthShell } from './auth-shell';
import { passwordsMatch } from './signup';

/** Landing page for the password-reset email link; Supabase signs the user in from the link first. */
@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell heading="Choose a new password" glyph="鍵">
      @if (!ready()) {
        <p class="muted" style="margin-top: 24px">Checking your link…</p>
      } @else if (!auth.user()) {
        <p class="callout error" style="margin-top: 24px">
          This reset link is invalid or has expired. <a class="link" routerLink="/forgot-password">Request a new one</a>.
        </p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @if (error()) {
            <p class="callout error" role="alert">{{ error() }}</p>
          }
          <div class="field">
            <label for="password">New password</label>
            <input id="password" class="input" type="password" formControlName="password" autocomplete="new-password" />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <span class="field-error">Use at least 8 characters.</span>
            }
          </div>
          <div class="field">
            <label for="confirm">Confirm new password</label>
            <input id="confirm" class="input" type="password" formControlName="confirm" autocomplete="new-password" />
            @if (form.controls.confirm.touched && form.hasError('mismatch')) {
              <span class="field-error">Passwords don't match.</span>
            }
          </div>
          <button class="btn btn-primary btn-block" type="submit" [disabled]="busy()">
            @if (busy()) {
              <span class="spinner"></span>
            }
            Save password
          </button>
        </form>
      }
    </app-auth-shell>
  `,
  styleUrl: './auth-form.scss',
})
export default class ResetPassword {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  protected readonly ready = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.auth.ready.then(() => this.ready.set(true));
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    const result = await this.auth.updatePassword(this.form.getRawValue().password);
    this.busy.set(false);
    if (result.error) {
      this.error.set(result.error);
      return;
    }
    this.toast.success('Password updated.');
    this.router.navigateByUrl('/library');
  }
}
