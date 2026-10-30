import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AuthService } from '../../core/auth.service';

/** Shared frame for the sign-in / sign-up / password pages. */
@Component({
  selector: 'app-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <div class="art" aria-hidden="true">
        <span class="display glyph">{{ glyph() }}</span>
        <p class="display quote">Every great story<br />starts on page one.</p>
      </div>
      <div class="card">
        <h1 class="display">{{ heading() }}</h1>
        @if (subheading()) {
          <p class="muted sub">{{ subheading() }}</p>
        }
        @if (!auth.configured) {
          <p class="callout error">
            Accounts aren't configured for this deployment yet. Set <code>SUPABASE_URL</code> and
            <code>SUPABASE_PUBLISHABLE_KEY</code> and rebuild.
          </p>
        }
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .wrap {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: calc(100vh - var(--header-h));
    }
    .art {
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: flex-end;
      padding: 48px;
      border-right: 1px solid var(--line);
      background:
        var(--tone),
        radial-gradient(circle at 30% 30%, rgb(255 90 54 / 0.35), transparent 55%),
        var(--ink-2);
    }
    .glyph {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -58%) rotate(-6deg);
      font-size: clamp(10rem, 22vw, 20rem);
      line-height: 1;
      color: var(--accent);
      opacity: 0.9;
      text-shadow: 14px 14px 0 rgb(0 0 0 / 0.35);
    }
    .quote {
      position: relative;
      font-size: clamp(1.3rem, 1rem + 1vw, 1.9rem);
      line-height: 1.2;
    }
    .card {
      align-self: center;
      justify-self: center;
      width: min(420px, 100%);
      padding: 48px 24px;
    }
    h1 {
      font-size: 2.1rem;
    }
    .sub {
      margin-top: 8px;
    }
    .callout {
      margin-top: 20px;
      font-size: 0.88rem;
    }
    code {
      font-size: 0.85em;
    }
    @media (max-width: 860px) {
      .wrap {
        grid-template-columns: 1fr;
        min-height: 0;
      }
      .art {
        display: none;
      }
    }
  `,
})
export class AuthShell {
  protected readonly auth = inject(AuthService);
  readonly heading = input.required<string>();
  readonly subheading = input<string>();
  readonly glyph = input('読');
}
