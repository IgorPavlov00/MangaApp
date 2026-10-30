import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, defer, retry, shareReplay, switchMap, throwError, timer } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class JikanService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, { at: number; value: Observable<unknown> }>();
  private nextSlot = 0;

  top(kind: MediaKind, filter?: string, limit = 15): Observable<Page<Media>> {
    return this.get(`/top/${kind}`, { filter, limit, sfw: true });
  }

  seasonNow(limit = 15): Observable<Page<Media>> {
    return this.get('/seasons/now', { limit, sfw: true });
  }

  search(kind: MediaKind, params: SearchParams): Observable<Page<Media>> {
    return this.get(`/${kind}`, { ...params, limit: PAGE_SIZE, sfw: true });
  }

  genres(kind: MediaKind): Observable<Page<Genre>> {
    return this.get(`/genres/${kind}`, { filter: 'genres' });
  }

  details(kind: MediaKind, id: number): Observable<Single<Media>> {
    return this.get(`/${kind}/${id}/full`);
  }

  characters(kind: MediaKind, id: number): Observable<Page<CharacterRole>> {
    return this.get(`/${kind}/${id}/characters`);
  }

  recommendations(kind: MediaKind, id: number): Observable<Page<Recommendation>> {
    return this.get(`/${kind}/${id}/recommendations`);
  }

  character(id: number): Observable<Single<CharacterFull>> {
    return this.get(`/characters/${id}/full`);
  }

  private get<T>(path: string, query: Record<string, string | number | boolean | undefined | null> = {}): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    }
    const key = `${path}?${params.toString()}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as Observable<T>;

    const request$ = defer(() => timer(this.reserveSlot())).pipe(
      switchMap(() => this.http.get<T>(BASE + path, { params })),
      retry({
        count: 3,
        delay: (error: HttpErrorResponse, attempt) =>
          error.status === 429 || error.status >= 500 ? timer(800 * attempt) : throwError(() => error),
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    // Drop failed requests from the cache so the next visit retries.
    const value = new Observable<T>((subscriber) =>
      request$.subscribe({
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

  /** Returns how long to wait so that requests leave at most once every MIN_SPACING_MS. */
  private reserveSlot(): number {
    const now = Date.now();
    const slot = Math.max(now, this.nextSlot);
    this.nextSlot = slot + MIN_SPACING_MS;
    return slot - now;
  }
}
