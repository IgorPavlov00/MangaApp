import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, TimeoutError, catchError, defer, retry, shareReplay, switchMap, throwError, timeout, timer } from 'rxjs';
import { AniListService } from './anilist.service';
import {
  CharacterFull,
  CharacterRole,
  Genre,
  Media,
  MediaKind,
  Page,
  Recommendation,
  SearchParams,
  Single,
} from './jikan.models';

const BASE = 'https://api.jikan.moe/v4';
/** Jikan allows ~3 requests/second; space requests out instead of tripping 429s. */
const MIN_SPACING_MS = 380;
const CACHE_TTL_MS = 10 * 60 * 1000;
const PAGE_SIZE = 24;
/** Jikan sometimes hangs instead of failing; don't make the user wait for a TCP timeout. */
const REQUEST_TIMEOUT_MS = 4000;
/** After an outage, go straight to AniList for a while instead of timing out on every request. */
const OUTAGE_BACKOFF_MS = 3 * 60 * 1000;
/** Remembered across reloads in this tab so each page load doesn't pay the timeout again. */
const OUTAGE_KEY = 'animan.jikanDownUntil';

/**
 * Catalogue data. Jikan (MyAnimeList) is the primary source; when it is down or slow, the same
 * request is answered by AniList, mapped into identical models.
 */
@Injectable({ providedIn: 'root' })
export class JikanService {
  private readonly http = inject(HttpClient);
  private readonly anilist = inject(AniListService);
  private readonly cache = new Map<string, { at: number; value: Observable<unknown> }>();
  private nextSlot = 0;
  private jikanDownUntil = readOutage();

  top(kind: MediaKind, filter?: string, limit = 15): Observable<Page<Media>> {
    return this.get(`/top/${kind}`, { filter, limit, sfw: true }, () => this.anilist.top(kind, filter, limit));
  }

  seasonNow(limit = 15): Observable<Page<Media>> {
    return this.get('/seasons/now', { limit, sfw: true }, () => this.anilist.seasonNow(limit));
  }

  search(kind: MediaKind, params: SearchParams): Observable<Page<Media>> {
    return this.get(`/${kind}`, { ...params, limit: PAGE_SIZE, sfw: true }, () =>
      this.anilist.search(kind, params, PAGE_SIZE),
    );
  }

  genres(kind: MediaKind): Observable<Page<Genre>> {
    return this.get(`/genres/${kind}`, { filter: 'genres' }, () => this.anilist.genres(kind));
  }

  details(kind: MediaKind, id: number): Observable<Single<Media>> {
    return this.get(`/${kind}/${id}/full`, {}, () => this.anilist.details(kind, id));
  }

  characters(kind: MediaKind, id: number): Observable<Page<CharacterRole>> {
    return this.get(`/${kind}/${id}/characters`, {}, () => this.anilist.characters(kind, id));
  }

  recommendations(kind: MediaKind, id: number): Observable<Page<Recommendation>> {
    return this.get(`/${kind}/${id}/recommendations`, {}, () => this.anilist.recommendations(kind, id));
  }

  /** MAL character ids are positive; negative ids are AniList characters (from the fallback). */
  character(id: number): Observable<Single<CharacterFull>> {
    if (id < 0) return this.cached(`anilist/character/${id}`, () => this.anilist.character(-id));
    return this.get(`/characters/${id}/full`, {}, () =>
      throwError(() => new Error('MyAnimeList characters are unavailable while Jikan is down')),
    );
  }

  private get<T>(
    path: string,
    query: Record<string, string | number | boolean | undefined | null>,
    fallback: () => Observable<T>,
  ): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    }

    return this.cached(`${path}?${params.toString()}`, () => {
      if (Date.now() < this.jikanDownUntil) return fallback();
      const jikan$ = defer(() => timer(this.reserveSlot())).pipe(
        switchMap(() => this.http.get<T>(BASE + path, { params }).pipe(timeout(REQUEST_TIMEOUT_MS))),
        retry({
          count: 2,
          delay: (error: HttpErrorResponse, attempt) => (error.status === 429 ? timer(800 * attempt) : throwError(() => error)),
        }),
      );
      return jikan$.pipe(
        catchError((error) => {
          if (isOutage(error)) this.markOutage();
          // Even a 404 is worth retrying on AniList: the title may simply be missing from Jikan's cache.
          return fallback();
        }),
      );
    });
  }

  /** Shares one request per key for CACHE_TTL_MS; failures are evicted so the next visit retries. */
  private cached<T>(key: string, source: () => Observable<T>): Observable<T> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as Observable<T>;

    const shared$ = defer(source).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    const value = new Observable<T>((subscriber) =>
      shared$.subscribe({
        next: (v) => subscriber.next(v),
        error: (e) => {
          this.cache.delete(key);
          subscriber.error(e);
        },
        complete: () => subscriber.complete(),
      }),
    );
    this.cache.set(key, { at: Date.now(), value });
    return value;
  }

  private markOutage(): void {
    this.jikanDownUntil = Date.now() + OUTAGE_BACKOFF_MS;
    try {
      sessionStorage.setItem(OUTAGE_KEY, String(this.jikanDownUntil));
    } catch {
      // Storage can be unavailable (private mode); the in-memory flag still applies.
    }
  }

  /** Returns how long to wait so that requests leave at most once every MIN_SPACING_MS. */
  private reserveSlot(): number {
    const now = Date.now();
    const slot = Math.max(now, this.nextSlot);
    this.nextSlot = slot + MIN_SPACING_MS;
    return slot - now;
  }
}

function readOutage(): number {
  try {
    return Number(sessionStorage.getItem(OUTAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function isOutage(error: unknown): boolean {
  if (error instanceof TimeoutError) return true;
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status === 429 || error.status >= 500);
}
