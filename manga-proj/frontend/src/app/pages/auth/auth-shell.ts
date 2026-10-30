import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AuthService } from '../../core/auth.service';

const ART = [
  'action',
  'fantasy',
  'horror',
  'romance',
  'sports',
  'mystery',
  'sci-fi',
  'shounen',
  'seinen',
  'mecha',
  'supernatural',
  'super-power',
  'adventure',
  'comedy',
  'drama',
];

/** Four columns of artwork; each list is doubled so the scroll loops seamlessly at -50%. */
const COLUMNS = [0, 1, 2, 3].map((c) => {
  const images = ART.filter((_, i) => i % 4 === c);
  return [...images, ...images];
});

/** Shared frame for the sign-in / sign-up / password pages: an animated manga wall beside the form. */
@Component({
  selector: 'app-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <div class="art" aria-hidden="true">
        <div class="wall">
          @for (column of columns; track $index) {
            <div class="column" [class.reverse]="$index % 2 === 1">
              @for (image of column; track $index) {
                <img [src]="'genres/thumbs/' + image + '.webp'" alt="" decoding="async" />
              }
            </div>
          }
        </div>
        <div class="shade"></div>
        <div class="brand">
          <span class="stamp">{{ glyph() }}</span>
          <p class="display quote">Every great story<br />starts on page one.</p>
        </div>
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
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
  protected readonly auth = inject(AuthService);
  protected readonly columns = COLUMNS;
  readonly heading = input.required<string>();
  readonly subheading = input<string>();
  readonly glyph = input('読');
}
