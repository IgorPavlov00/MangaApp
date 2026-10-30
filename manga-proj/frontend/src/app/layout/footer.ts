import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="foot">
      <div class="container inner">
        <div class="brand">
          <span class="display">AniMan</span>
          <p class="muted">Find your next favourite manga or anime, and keep track of everything you read and watch.</p>
        </div>
        <nav class="links" aria-label="Footer">
          <a routerLink="/manga">Browse manga</a>
          <a routerLink="/anime">Browse anime</a>
          <a routerLink="/library">My library</a>
        </nav>
        <p class="credit muted">
          Data from <a class="link" href="https://jikan.moe" target="_blank" rel="noopener">Jikan</a>, the unofficial
          <a class="link" href="https://myanimelist.net" target="_blank" rel="noopener">MyAnimeList</a> API, with
          <a class="link" href="https://anilist.co" target="_blank" rel="noopener">AniList</a> as a backup.
          Built with Angular, Spring Boot and Supabase.
        </p>
      </div>
      <div class="kanji display" aria-hidden="true">漫画アニメ</div>
    </footer>
  `,
  styles: `
    .foot {
      position: relative;
      overflow: hidden;
      margin-top: 40px;
      border-top: 1px solid var(--line);
      background: var(--ink-2);
    }
    .inner {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 24px 40px;
      padding-block: 44px 36px;
    }
    .brand .display {
      font-size: 1.5rem;
    }
    .brand p {
      margin-top: 8px;
      max-width: 42ch;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 22px;
      align-content: start;
      justify-content: flex-end;
      font-weight: 700;
    }
    .links a:hover {
      color: var(--accent-strong);
    }
    .credit {
      grid-column: 1 / -1;
      padding-top: 20px;
      border-top: 1px solid var(--line);
      font-size: 0.85rem;
    }
    .kanji {
      position: absolute;
      right: -20px;
      bottom: -34px;
      font-size: clamp(4rem, 12vw, 9rem);
      line-height: 1;
      color: rgb(255 255 255 / 0.025);
      white-space: nowrap;
      pointer-events: none;
    }
    @media (max-width: 720px) {
      .inner {
        grid-template-columns: 1fr;
      }
      .links {
        justify-content: flex-start;
      }
    }
  `,
})
export class Footer {}
