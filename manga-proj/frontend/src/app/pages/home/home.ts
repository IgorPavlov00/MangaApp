import { ChangeDetectionStrategy, Component, DestroyRef, WritableSignal, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { JikanService } from '../../core/jikan.service';
import { Media, Page, coverUrl, displayTitle } from '../../core/jikan.models';
import { Icon } from '../../shared/icon';
import { MediaCard } from '../../shared/media-card';
import { MediaRow } from '../../shared/media-row';
import { GENRE_TILES } from './genres';

interface Shelf {
  items: WritableSignal<Media[]>;
  loading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, DecimalPipe, Icon, MediaCard, MediaRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export default class Home {
  private readonly jikan = inject(JikanService);
  protected readonly auth = inject(AuthService);

  // Requests are queued by JikanService (rate limit), so order these by what is highest on the page.
  protected readonly featured = this.shelf(this.jikan.top('manga', 'publishing', 6));
  protected readonly trending = this.shelf(this.jikan.top('manga', 'bypopularity', 18));
  protected readonly airing = this.shelf(this.jikan.top('anime', 'airing', 18));
  protected readonly season = this.shelf(this.jikan.seasonNow(18));
  protected readonly greats = this.shelf(this.jikan.top('manga', undefined, 18));

  protected readonly genres = GENRE_TILES;
  protected readonly heroIndex = signal(0);
  protected readonly hero = computed(() => this.featured.items()[this.heroIndex()] ?? null);
  protected readonly coverUrl = coverUrl;
  protected readonly displayTitle = displayTitle;

  constructor() {
    const timer = setInterval(() => this.next(), 9000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected next(): void {
    const count = this.featured.items().length;
    if (count) this.heroIndex.update((i) => (i + 1) % count);
  }

  protected select(index: number): void {
    this.heroIndex.set(index);
  }

  protected meta(m: Media): string {
    const year = m.year ?? (m.published?.from ?? m.aired?.from)?.slice(0, 4);
    return [m.type, year].filter(Boolean).join(' · ');
  }

  private shelf(source: Observable<Page<Media>>): Shelf {
    const shelf: Shelf = { items: signal<Media[]>([]), loading: signal(true), error: signal<string | null>(null) };
    source.subscribe({
      next: (page) => {
        // The top lists occasionally repeat an entry across pages; keep the first.
        const seen = new Set<number>();
        shelf.items.set(page.data.filter((m) => !seen.has(m.mal_id) && seen.add(m.mal_id)));
        shelf.loading.set(false);
      },
      error: () => {
        shelf.error.set('Could not load this list right now. MyAnimeList data may be temporarily unavailable.');
        shelf.loading.set(false);
      },
    });
    return shelf;
  }
}
