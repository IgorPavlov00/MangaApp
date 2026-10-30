import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { AuthShell } from './auth-shell';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell heading="Welcome back" subheading="Sign in to your library.">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error()) {
          <p class="callout error" role="alert">{{ error() }}</p>
        }
        <div class="field">
          <label for="email">Email</label>
          <input id="email" class="input" type="email" formControlName="email" autocomplete="email" [class.invalid]="invalid('email')" />
          @if (invalid('email')) {
            <span class="field-error">Enter a valid email address.</span>
          }
        </div>
        <div class="field">
          <div class="row">
            <label for="password">Password</label>
            <a class="link" routerLink="/forgot-password">Forgot password?</a>
          </div>
          <input id="password" class="input" type="password" formControlName="password" autocomplete="current-password" [class.invalid]="invalid('password')" />
          @if (invalid('password')) {
            <span class="field-error">Enter your password.</span>
          }
        </div>
        <button class="btn btn-primary btn-block" type="submit" [disabled]="busy() || !auth.configured">
          @if (busy()) {
            <span class="spinner"></span>
          }
          Sign in
        </button>
      </form>
      <p class="alt muted">New here? <a class="link" routerLink="/signup">Create an account</a></p>
    </app-auth-shell>
  `,
  styleUrl: './auth-form.scss',
})
export default class Login {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Where to go after signing in (set by the auth guard). */
  readonly redirect = input<string>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected invalid(name: 'email' | 'password'): boolean {
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
    const { email, password } = this.form.getRawValue();
    const result = await this.auth.signIn(email.trim(), password);
    this.busy.set(false);
    if (result.error) {
      this.error.set(result.error);
      return;
    }
    this.toast.success(`Welcome back, ${this.auth.displayName()}!`);
    const target = this.redirect();
    this.router.navigateByUrl(target?.startsWith('/') && !target.startsWith('//') ? target : '/library');
  }
}
