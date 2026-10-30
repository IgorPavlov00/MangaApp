import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { AuthShell } from './auth-shell';

export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink, Icon, AuthShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell heading="Create your account" subheading="Free. Track everything you read and watch." glyph="始">
      @if (sentTo()) {
        <div class="done" role="status">
          <app-icon name="mail" />
          <strong>Check your inbox</strong>
          <p class="muted">
            We sent a confirmation link to <strong>{{ sentTo() }}</strong>. Open it to activate your account. It may
            take a minute, and check your spam folder too.
          </p>
          <a class="link" routerLink="/login">Back to sign in</a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @if (error()) {
            <p class="callout error" role="alert">{{ error() }}</p>
          }
          <div class="field">
            <label for="name">Display name</label>
            <input id="name" class="input" formControlName="displayName" autocomplete="nickname" maxlength="40" [class.invalid]="invalid('displayName')" />
            @if (invalid('displayName')) {
              <span class="field-error">Pick a name between 2 and 40 characters.</span>
            }
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" class="input" type="email" formControlName="email" autocomplete="email" [class.invalid]="invalid('email')" />
            @if (invalid('email')) {
              <span class="field-error">Enter a valid email address.</span>
            }
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" class="input" type="password" formControlName="password" autocomplete="new-password" [class.invalid]="invalid('password')" />
            @if (invalid('password')) {
              <span class="field-error">Use at least 8 characters.</span>
            }
          </div>
          <div class="field">
            <label for="confirm">Confirm password</label>
            <input
              id="confirm"
              class="input"
              type="password"
              formControlName="confirm"
              autocomplete="new-password"
              [class.invalid]="form.controls.confirm.touched && form.hasError('mismatch')"
            />
            @if (form.controls.confirm.touched && form.hasError('mismatch')) {
              <span class="field-error">Passwords don't match.</span>
            }
          </div>
          <button class="btn btn-primary btn-block" type="submit" [disabled]="busy() || !auth.configured">
            @if (busy()) {
              <span class="spinner"></span>
            }
            Create account
          </button>
        </form>
        <p class="alt muted">Already have an account? <a class="link" routerLink="/login">Sign in</a></p>
      }
    </app-auth-shell>
  `,
  styleUrl: './auth-form.scss',
})
export default class Signup {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sentTo = signal<string | null>(null);

  protected invalid(name: 'displayName' | 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const { displayName, email, password } = this.form.getRawValue();
    const result = await this.auth.signUp(email.trim(), password, displayName.trim());
    this.busy.set(false);
    if (result.error) {
      this.error.set(result.error);
    } else if (result.needsConfirmation) {
      this.sentTo.set(email.trim());
    } else {
      // Email confirmation is turned off in Supabase: the user is signed in straight away.
      this.toast.success(`Welcome to AniMan, ${displayName.trim()}!`);
      this.router.navigateByUrl('/library');
    }
  }
}
