import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      <div class="empty">
        <span class="glyph" aria-hidden="true">404</span>
        <h1>This page wandered off</h1>
        <p>The page you're looking for doesn't exist, or it moved when the site was rebuilt.</p>
        <a class="btn btn-primary" routerLink="/">Back home</a>
      </div>
    </div>
  `,
})
export default class NotFound {}
