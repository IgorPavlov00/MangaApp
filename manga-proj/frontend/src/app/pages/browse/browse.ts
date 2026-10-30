import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { JikanService } from '../../core/jikan.service';
import { Genre, Media, MediaKind, Page, SearchParams, coverUrl, displayTitle } from '../../core/jikan.models';
import { Icon } from '../../shared/icon';
import { MediaCard } from '../../shared/media-card';
import { Pagination } from '../../shared/pagination';
import { GENRE_TILES } from '../home/genres';
import { ORDER_OPTIONS, SCORE_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS } from './options';

interface Filters {
  q: string;
  genres: number[];
  type: string;
  status: string;
  minScore: string;
  orderBy: string;
  page: number;
}

@Component({
  selector: 'app-browse',
  imports: [RouterLink, DecimalPipe, Icon, MediaCard, Pagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './browse.html',
  styleUrl: './browse.scss',
})
export default class Browse {
  private readonly jikan = inject(JikanService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** From the route's data: which catalogue to browse. */
  readonly kind = input.required<MediaKind>();

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly filters = computed<Filters>(() => {
    const p = this.queryParams();
    return {
      q: p.get('q') ?? '',
      genres: (p.get('genres') ?? '')
        .split(',')
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0),
      type: p.get('type') ?? '',
      status: p.get('status') ?? '',
      minScore: p.get('min_score') ?? '',
      orderBy: p.get('order_by') ?? 'members',
      page: Math.max(1, Number(p.get('page')) || 1),
    };
  });

  protected readonly results = signal<Page<Media> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly genres = signal<Genre[]>([]);
  /** Opened from the home page's "All genres" link (?panel=genres). */
  protected readonly showGenres = signal(this.route.snapshot.queryParamMap.get('panel') === 'genres');
  protected readonly term = linkedSignal(() => this.filters().q);

  protected readonly typeOptions = computed(() => TYPE_OPTIONS[this.kind()]);
  protected readonly statusOptions = computed(() => STATUS_OPTIONS[this.kind()]);
  protected readonly orderOptions = ORDER_OPTIONS;
  protected readonly scoreOptions = SCORE_OPTIONS;
  protected readonly activeFilterCount = computed(() => {
    const f = this.filters();
    return f.genres.length + [f.type, f.status, f.minScore].filter(Boolean).length;
  });
  protected readonly lastPage = computed(() => Math.min(this.results()?.pagination?.last_visible_page ?? 1, 400));
  protected readonly total = computed(() => this.results()?.pagination?.items?.total ?? null);
  protected readonly placeholders = Array.from({ length: 12 }, (_, i) => i);
  protected readonly coverUrl = coverUrl;
  protected readonly displayTitle = displayTitle;

  private readonly typing = new Subject<string>();

  constructor() {
    const request = computed(() => ({ kind: this.kind(), filters: this.filters() }));
    toObservable(request)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ kind, filters }) =>
          this.jikan.search(kind, toSearchParams(filters)).pipe(
            catchError(() => {
              this.error.set('Could not load results. MyAnimeList data may be temporarily unavailable. Try again shortly.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((page) => {
        // Search results can contain the same entry twice across MAL's index; dedupe for stable tracking.
        if (page) {
          const seen = new Set<number>();
          page = { ...page, data: page.data.filter((m) => !seen.has(m.mal_id) && seen.add(m.mal_id)) };
        }
        this.results.set(page);
        this.loading.set(false);
      });

    toObservable(this.kind)
      .pipe(
        switchMap((kind) => this.jikan.genres(kind).pipe(catchError(() => of({ data: [] as Genre[] })))),
        map((page) => [...page.data].sort((a, b) => a.name.localeCompare(b.name))),
        takeUntilDestroyed(),
      )
      .subscribe((list) => this.genres.set(list));

    this.typing
      .pipe(debounceTime(450), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.update({ q: q.trim() || null }, true));
  }

  protected onType(value: string): void {
    this.term.set(value);
    this.typing.next(value);
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    this.update({ q: this.term().trim() || null });
  }

  protected setFilter(key: 'type' | 'status' | 'min_score' | 'order_by', value: string): void {
    this.update({ [key]: value || null });
  }

  protected toggleGenre(id: number): void {
    const current = this.filters().genres;
    const next = current.includes(id) ? current.filter((g) => g !== id) : [...current, id];
    this.update({ genres: next.length ? next.join(',') : null });
  }

  protected genreName(id: number): string {
    return (
      this.genres().find((g) => g.mal_id === id)?.name ?? GENRE_TILES.find((g) => g.id === id)?.name ?? `Genre ${id}`
    );
  }

  protected clearFilters(): void {
    this.update({ genres: null, type: null, status: null, min_score: null });
  }

  protected goToPage(page: number): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { page }, queryParamsHandling: 'merge' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected meta(m: Media): string {
    const year = m.year ?? (m.published?.from ?? m.aired?.from)?.slice(0, 4);
    return [m.type, year].filter(Boolean).join(' · ');
  }

  /** Any filter change resets to page 1. */
  private update(params: Params, replaceUrl = false): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...params, page: null },
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}

function toSearchParams(f: Filters): SearchParams {
  const order = ORDER_OPTIONS.find((o) => o.value === f.orderBy) ?? ORDER_OPTIONS[0];
  return {
    q: f.q || undefined,
    genres: f.genres.length ? f.genres.join(',') : undefined,
    type: f.type || undefined,
    status: f.status || undefined,
    min_score: f.minScore ? Number(f.minScore) : undefined,
    order_by: order.value,
    sort: order.sort,
    page: f.page,
  };
}
