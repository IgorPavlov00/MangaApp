import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { JikanService } from '../../core/jikan.service';
import { CharacterFull, coverUrl } from '../../core/jikan.models';
import { MediaCard } from '../../shared/media-card';
import { MediaRow } from '../../shared/media-row';

@Component({
  selector: 'app-character',
  imports: [RouterLink, DecimalPipe, MediaCard, MediaRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="container page layout">
        <div class="skeleton portrait"></div>
        <div>
          <div class="skeleton" style="width: 50%; height: 44px"></div>
          <div class="skeleton" style="height: 160px; margin-top: 24px"></div>
        </div>
      </div>
    } @else if (character(); as c) {
      <div class="container page">
        <div class="layout">
          <img class="portrait" [src]="coverUrl(c.images)" [alt]="c.name" />
          <div class="main">
            <p class="kicker">Character</p>
            <h1 class="display">{{ c.name }}</h1>
            @if (c.name_kanji) {
              <p class="kanji">{{ c.name_kanji }}</p>
            }
            <div class="chips">
              <span class="chip">♥ {{ c.favorites | number }} favourites</span>
              @for (n of c.nicknames.slice(0, 4); track n) {
                <span class="chip">“{{ n }}”</span>
              }
            </div>
            @if (about()) {
              <p class="about" [class.clamped]="!expanded() && about().length > 900">{{ about() }}</p>
              @if (about().length > 900) {
                <button class="link more" type="button" (click)="expanded.set(!expanded())">
                  {{ expanded() ? 'Show less' : 'Read more' }}
                </button>
              }
            }
            @if (japaneseVoices().length) {
              <h2 class="section-title voices-title">Voiced by</h2>
              <ul class="voices">
                @for (v of japaneseVoices(); track v.person.mal_id) {
                  <li>
                    <img [src]="v.person.images.jpg.image_url" [alt]="v.person.name" loading="lazy" />
                    <span>{{ v.person.name }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>

        @if (c.manga.length) {
          <app-media-row heading="Appears in manga">
            @for (x of c.manga; track x.manga.mal_id) {
              <app-media-card kind="manga" [malId]="x.manga.mal_id" [title]="x.manga.title" [image]="coverUrl(x.manga.images, 'normal')" [meta]="x.role" />
            }
          </app-media-row>
        }
        @if (c.anime.length) {
          <app-media-row heading="Appears in anime">
            @for (x of c.anime; track x.anime.mal_id) {
              <app-media-card kind="anime" [malId]="x.anime.mal_id" [title]="x.anime.title" [image]="coverUrl(x.anime.images, 'normal')" [meta]="x.role" />
            }
          </app-media-row>
        }
      </div>
    } @else {
      <div class="container page">
        <div class="empty">
          <span class="glyph" aria-hidden="true">迷</span>
          <h1>Character unavailable</h1>
          <p>We couldn't load this character. MyAnimeList may be busy. Try again shortly.</p>
          <a class="btn" routerLink="/">Back home</a>
        </div>
      </div>
    }
  `,
  styles: `
    .layout {
      display: grid;
      grid-template-columns: clamp(180px, 22vw, 260px) minmax(0, 1fr);
      gap: clamp(24px, 4vw, 48px);
      align-items: start;
    }
    .portrait {
      width: 100%;
      aspect-ratio: 3 / 4;
      object-fit: cover;
      border-radius: var(--radius-lg);
      box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08), 12px 12px 0 -2px var(--accent);
    }
    h1 {
      margin-top: 10px;
      font-size: clamp(2rem, 1.2rem + 3vw, 3.4rem);
      line-height: 1.05;
    }
    .kanji {
      margin-top: 8px;
      font-size: 1.2rem;
      color: var(--muted);
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 18px;
    }
    .about {
      margin-top: 24px;
      max-width: 75ch;
      white-space: pre-line;
      line-height: 1.7;
      color: #dcd5e3;
    }
    .about.clamped {
      display: -webkit-box;
      -webkit-line-clamp: 12;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .more {
      margin-top: 8px;
      padding: 0;
      border: 0;
      background: none;
      cursor: pointer;
    }
    .voices-title {
      margin: 36px 0 14px;
    }
    .voices {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .voices li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 14px 6px 6px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--ink-2);
      font-weight: 600;
      font-size: 0.9rem;
    }
    .voices img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }
    @media (max-width: 680px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .portrait {
        width: 60%;
        max-width: 240px;
      }
    }
  `,
})
export default class Character {
  private readonly jikan = inject(JikanService);
  private readonly title = inject(Title);

  readonly id = input.required<string>();

  protected readonly character = signal<CharacterFull | null>(null);
  protected readonly loading = signal(true);
  protected readonly expanded = signal(false);
  protected readonly coverUrl = coverUrl;

  protected readonly about = computed(() => (this.character()?.about ?? '').trim());
  protected readonly japaneseVoices = computed(() =>
    (this.character()?.voices ?? []).filter((v) => v.language === 'Japanese').slice(0, 4),
  );

  constructor() {
    toObservable(this.id)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.expanded.set(false);
        }),
        switchMap((id) => this.jikan.character(Number(id)).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.character.set(res?.data ?? null);
        this.loading.set(false);
        this.title.setTitle(res ? `${res.data.name} · AniMan` : 'Character · AniMan');
      });
  }
}
