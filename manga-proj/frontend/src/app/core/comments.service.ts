import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MediaKind } from './jikan.models';

export const COMMENT_MAX_LENGTH = 4000;

export interface Comment {
  id: number;
  mediaType: 'MANGA' | 'ANIME';
  malId: number;
  authorName: string;
  body: string;
  spoiler: boolean;
  /** True when the signed-in user wrote it. */
  mine: boolean;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentPage {
  items: Comment[];
  page: number;
  totalPages: number;
  total: number;
}

export interface CommentInput {
  body: string;
  spoiler: boolean;
}

/** Comments on titles, stored by the Spring API. Anyone can read; writing needs a signed-in user. */
@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/comments`;

  list(kind: MediaKind, malId: number, page = 0): Observable<CommentPage> {
    return this.http.get<CommentPage>(`${this.base}/${kind}/${malId}`, { params: { page } });
  }

  create(kind: MediaKind, malId: number, input: CommentInput): Observable<Comment> {
    return this.http.post<Comment>(`${this.base}/${kind}/${malId}`, input);
  }

  update(id: number, input: CommentInput): Observable<Comment> {
    return this.http.put<Comment>(`${this.base}/${id}`, input);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
