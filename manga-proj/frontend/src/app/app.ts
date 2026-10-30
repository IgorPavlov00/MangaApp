import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header';
import { Footer } from './layout/footer';
import { Toasts } from './layout/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Toasts],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip" href="#main">Skip to content</a>
    <app-header />
    <main id="main">
      <router-outlet />
    </main>
    <app-footer />
    <app-toasts />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    main {
      flex: 1;
    }
    .skip {
      position: absolute;
      left: 12px;
      top: -60px;
      z-index: 200;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      background: var(--accent);
      color: var(--accent-ink);
      font-weight: 800;
    }
    .skip:focus {
      top: 12px;
    }
  `,
})
export class App {}
