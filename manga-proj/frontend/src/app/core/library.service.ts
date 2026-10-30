import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { MediaKind } from './jikan.models';

export type LibraryStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';
export const LIBRARY_STATUSES: LibraryStatus[] = ['IN_PROGRESS', 'PLANNING', 'COMPLETED', 'ON_HOLD', 'DROPPED'];

export interface LibraryEntry {
  mediaType: 'MANGA' | 'ANIME';
  malId: number;
  title: string;
  imageUrl: string | null;
  status: LibraryStatus;
  rating: number | null;
  progress: number | null;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveEntry {
  title: string;
  imageUrl: string | null;
  status: LibraryStatus;
  rating: number | null;
  progress: number | null;
  favorite: boolean;
}

export interface MediaStats {
  total: number;
  byStatus: Record<LibraryStatus, number>;
  averageRating: number | null;
}

export interface LibraryStats {
  manga: MediaStats;
  anime: MediaStats;
}

export interface Me {
  id: string;
  email: string;
  displayName: string;
  stats: LibraryStats;
}

export interface ApiRecommendation {
  mediaType: 'MANGA' | 'ANIME';
  malId: number;
  title: string;
  imageUrl: string | null;
  score: number;
  because: string[];
}

export function statusLabel(status: LibraryStatus, kind: MediaKind): string {
  switch (status) {
    case 'IN_PROGRESS':
      return kind === 'manga' ? 'Reading' : 'Watching';
    case 'PLANNING':
      return kind === 'manga' ? 'Plan to read' : 'Plan to watch';
    case 'COMPLETED':
      return 'Completed';
    case 'ON_HOLD':
      return 'On hold';
    case 'DROPPED':
      return 'Dropped';
  }
}

/** Client for the Spring Boot API, which stores each user's library in Supabase Postgres. */
@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  list(kind?: MediaKind): Observable<LibraryEntry[]> {
    return this.http.get<LibraryEntry[]>(`${this.base}/library`, { params: kind ? { mediaType: kind } : {} });
  }

  /** The user's entry for a title, or null when it is not in their library. */
  get(kind: MediaKind, malId: number): Observable<LibraryEntry | null> {
    return this.http
      .get<LibraryEntry>(`${this.base}/library/${kind}/${malId}`)
      .pipe(catchError((e: HttpErrorResponse) => (e.status === 404 ? of(null) : throwError(() => e))));
  }

  save(kind: MediaKind, malId: number, entry: SaveEntry): Observable<LibraryEntry> {
    return this.http.put<LibraryEntry>(`${this.base}/library/${kind}/${malId}`, entry);
  }

  remove(kind: MediaKind, malId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/library/${kind}/${malId}`);
  }

  me(): Observable<Me> {
    return this.http.get<Me>(`${this.base}/me`);
  }

  recommendations(kind: MediaKind, limit = 12): Observable<ApiRecommendation[]> {
    return this.http.get<ApiRecommendation[]>(`${this.base}/recommendations`, { params: { mediaType: kind, limit } });
  }
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Could not reach the server. Check your connection and try again.';
    if (error.status === 401) return 'Your session has expired. Please sign in again.';
    const detail = error.error?.detail;
    if (typeof detail === 'string') return detail;
  }
  return 'Something went wrong. Please try again.';
}
