import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { passwordsMatch } from '../auth/signup';

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page narrow">
      <p class="kicker">Account</p>
      <h1 class="display">Settings</h1>
      <p class="muted email">Signed in as <strong>{{ auth.user()?.email }}</strong></p>

      <section class="card">
        <h2>Profile</h2>
        <form [formGroup]="profile" (ngSubmit)="saveName()" novalidate>
          <div class="field">
            <label for="name">Display name</label>
            <input id="name" class="input" formControlName="displayName" maxlength="40" />
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="savingName() || profile.invalid || profile.pristine">Save</button>
        </form>
      </section>

      <section class="card">
        <h2>Change password</h2>
        <form [formGroup]="password" (ngSubmit)="savePassword()" novalidate>
          <div class="field">
            <label for="pw">New password</label>
            <input id="pw" class="input" type="password" formControlName="password" autocomplete="new-password" />
            @if (password.controls.password.touched && password.controls.password.invalid) {
              <span class="field-error">Use at least 8 characters.</span>
            }
          </div>
          <div class="field">
            <label for="pw2">Confirm new password</label>
            <input id="pw2" class="input" type="password" formControlName="confirm" autocomplete="new-password" />
            @if (password.controls.confirm.touched && password.hasError('mismatch')) {
              <span class="field-error">Passwords don't match.</span>
            }
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="savingPassword()">Update password</button>
        </form>
      </section>

      <button class="btn btn-ghost" type="button" (click)="signOut()"><app-icon name="log-out" /> Sign out</button>
    </div>
  `,
  styles: `
    .narrow {
      max-width: 640px;
    }
    h1 {
      margin-top: 8px;
      font-size: clamp(2rem, 1.4rem + 2vw, 2.8rem);
    }
    .email {
      margin-top: 8px;
      overflow-wrap: anywhere;
    }
    .card {
      margin-top: 28px;
      padding: 24px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--line);
      background: var(--ink-2);
    }
    h2 {
      font-size: 1.1rem;
      font-weight: 800;
    }
    form {
      display: grid;
      gap: 16px;
      margin-top: 18px;
      justify-items: start;
    }
    .field {
      width: 100%;
    }
    .btn-ghost {
      margin-top: 28px;
    }
  `,
})
export default class Account {
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly profile = this.fb.group({
    displayName: [this.auth.displayName(), [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
  });
  protected readonly password = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  protected readonly savingName = signal(false);
  protected readonly savingPassword = signal(false);

  protected async saveName(): Promise<void> {
    this.savingName.set(true);
    const result = await this.auth.updateDisplayName(this.profile.getRawValue().displayName.trim());
    this.savingName.set(false);
    if (result.error) {
      this.toast.error(result.error);
      return;
    }
    this.profile.markAsPristine();
    this.toast.success('Display name saved.');
  }

  protected async savePassword(): Promise<void> {
    if (this.password.invalid) {
      this.password.markAllAsTouched();
      return;
    }
    this.savingPassword.set(true);
    const result = await this.auth.updatePassword(this.password.getRawValue().password);
    this.savingPassword.set(false);
    if (result.error) {
      this.toast.error(result.error);
      return;
    }
    this.password.reset();
    this.toast.success('Password updated.');
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }
}
