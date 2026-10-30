import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthError, Session, SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface AuthResult {
  error?: string;
  /** True when Supabase wants the user to confirm their email before signing in. */
  needsConfirmation?: boolean;
}

/** Sign-up, sign-in, email confirmation and password reset are all handled by Supabase Auth. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly client: SupabaseClient | null;

  readonly configured = Boolean(environment.supabaseUrl && environment.supabaseKey);
  readonly session = signal<Session | null>(null);
  readonly user = computed(() => this.session()?.user ?? null);
  readonly displayName = computed(() => {
    const user = this.user();
    if (!user) return '';
    const name = user.user_metadata?.['display_name'];
    return typeof name === 'string' && name.trim() ? name : (user.email ?? '').split('@')[0];
  });
  /** Resolves once the stored session (or one from an email link) has been loaded. */
  readonly ready: Promise<void>;

  constructor() {
    if (!this.configured) {
      this.client = null;
      this.ready = Promise.resolve();
      return;
    }
    this.client = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Implicit flow lets a confirmation link work even when opened on another device.
        flowType: 'implicit',
      },
    });
    this.client.auth.onAuthStateChange((event, session) => {
      this.session.set(session);
      if (event === 'PASSWORD_RECOVERY') {
        // Supabase recommends not awaiting other calls inside this callback.
        setTimeout(() => this.router.navigateByUrl('/reset-password'));
      }
    });
    this.ready = this.client.auth.getSession().then(({ data }) => this.session.set(data.session));
  }

  /** Current access token, refreshed by supabase-js when close to expiry. */
  async accessToken(): Promise<string | null> {
    if (!this.client) return null;
    const { data } = await this.client.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    if (!this.client) return notConfigured();
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    return error ? { error: friendly(error) } : {};
  }

  async signUp(email: string, password: string, displayName: string): Promise<AuthResult> {
    if (!this.client) return notConfigured();
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        data: { display_name: displayName },
      },
    });
    if (error) return { error: friendly(error) };
    return { needsConfirmation: !data.session };
  }

  async signOut(): Promise<void> {
    await this.client?.auth.signOut();
    this.session.set(null);
  }

  async sendPasswordReset(email: string): Promise<AuthResult> {
    if (!this.client) return notConfigured();
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    });
    return error ? { error: friendly(error) } : {};
  }

  async updatePassword(password: string): Promise<AuthResult> {
    if (!this.client) return notConfigured();
    const { error } = await this.client.auth.updateUser({ password });
    return error ? { error: friendly(error) } : {};
  }

  async updateDisplayName(displayName: string): Promise<AuthResult> {
    if (!this.client) return notConfigured();
    const { data, error } = await this.client.auth.updateUser({ data: { display_name: displayName } });
    if (error) return { error: friendly(error) };
    // Refresh so the new name is reflected in the session (and in the next access token).
    if (data.user) await this.client.auth.refreshSession();
    return {};
  }
}

function notConfigured(): AuthResult {
  return { error: 'Accounts are not configured for this deployment (missing Supabase settings).' };
}

function friendly(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Wrong email or password.';
    case 'email_not_confirmed':
      return 'Please confirm your email first. Check your inbox for the link.';
    case 'user_already_exists':
      return 'An account with this email already exists.';
    case 'weak_password':
      return 'That password is too weak. Use at least 8 characters.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'same_password':
      return 'The new password must be different from the old one.';
    default:
      return error.message;
  }
}
