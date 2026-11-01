import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { COMMENT_MAX_LENGTH, Comment, CommentsService } from '../../core/comments.service';
import { JikanService } from '../../core/jikan.service';
import { MediaKind, Review } from '../../core/jikan.models';
import { apiErrorMessage } from '../../core/library.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';

type Tab = 'comments' | 'reviews';

/** Long reviews are clamped until the reader expands them. */
const REVIEW_CLAMP = 700;

/** Community comments (our API) and MyAnimeList reviews (Jikan) for one title. */
@Component({
  selector: 'app-discussion',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discussion.html',
  styleUrl: './discussion.scss',
})
export class Discussion {
  readonly kind = input.required<MediaKind>();
  readonly malId = input.required<number>();
  readonly malUrl = input<string>('');

  protected readonly auth = inject(AuthService);
  private readonly comments$ = inject(CommentsService);
  private readonly jikan = inject(JikanService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly maxLength = COMMENT_MAX_LENGTH;
  protected readonly reviewClamp = REVIEW_CLAMP;
  protected readonly tab = signal<Tab>('comments');
  protected readonly loginLink = computed(() => ({ redirect: this.router.url }));

  // Comments
  protected readonly comments = signal<Comment[]>([]);
  protected readonly commentTotal = signal(0);
  protected readonly commentsLoading = signal(true);
  protected readonly commentsError = signal<string | null>(null);
  protected readonly commentPage = signal(0);
  protected readonly commentPages = signal(0);
  protected readonly draft = signal('');
  protected readonly draftSpoiler = signal(false);
  protected readonly posting = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly editDraft = signal('');
  protected readonly editSpoiler = signal(false);
  protected readonly confirmDeleteId = signal<number | null>(null);
  protected readonly revealed = signal<ReadonlySet<number>>(new Set());

  // Reviews
  protected readonly reviews = signal<Review[]>([]);
  protected readonly reviewsLoading = signal(false);
  protected readonly reviewsLoaded = signal(false);
  protected readonly reviewsError = signal(false);
  protected readonly reviewPage = signal(1);
  protected readonly reviewsHasMore = signal(false);
  protected readonly expandedReviews = signal<ReadonlySet<number>>(new Set());

  constructor() {
    // Reload when the title changes or the user signs in/out (so "mine" flags are right).
    effect(() => {
      const kind = this.kind();
      const id = this.malId();
      this.auth.user();
      untracked(() => this.loadComments(kind, id));
    });
    effect(() => {
      this.kind();
      this.malId();
      untracked(() => {
        this.reviews.set([]);
        this.reviewsLoaded.set(false);
        this.reviewsError.set(false);
        this.reviewPage.set(1);
        if (this.tab() === 'reviews') this.loadReviews();
      });
    });
  }

  protected selectTab(tab: Tab): void {
    this.tab.set(tab);
    // Reviews come from rate-limited Jikan, so only fetch them once someone asks.
    if (tab === 'reviews' && !this.reviewsLoaded() && !this.reviewsLoading()) this.loadReviews();
  }

  // ---------- Comments ----------

  protected loadComments(kind = this.kind(), id = this.malId(), page = 0): void {
    this.commentsLoading.set(true);
    this.commentsError.set(null);
    this.comments$.list(kind, id, page).subscribe({
      next: (res) => {
        if (kind !== this.kind() || id !== this.malId()) return;
        this.comments.update((list) => (page === 0 ? res.items : [...list, ...res.items.filter((c) => !list.some((x) => x.id === c.id))]));
        this.commentTotal.set(res.total);
        this.commentPage.set(res.page);
        this.commentPages.set(res.totalPages);
        this.commentsLoading.set(false);
      },
      error: (e) => {
        this.commentsError.set(apiErrorMessage(e));
        this.commentsLoading.set(false);
      },
    });
  }

  protected moreComments(): void {
    this.loadComments(this.kind(), this.malId(), this.commentPage() + 1);
  }

  protected post(): void {
    const body = this.draft().trim();
    if (!body || this.posting()) return;
    this.posting.set(true);
    this.comments$.create(this.kind(), this.malId(), { body, spoiler: this.draftSpoiler() }).subscribe({
      next: (c) => {
        this.comments.update((list) => [c, ...list]);
        this.commentTotal.update((n) => n + 1);
        this.draft.set('');
        this.draftSpoiler.set(false);
        this.posting.set(false);
        this.toast.success('Comment posted');
      },
      error: (e) => {
        this.posting.set(false);
        this.toast.error(apiErrorMessage(e));
      },
    });
  }

  protected startEdit(c: Comment): void {
    this.confirmDeleteId.set(null);
    this.editingId.set(c.id);
    this.editDraft.set(c.body);
    this.editSpoiler.set(c.spoiler);
  }

  protected saveEdit(c: Comment): void {
    const body = this.editDraft().trim();
    if (!body) return;
    this.posting.set(true);
    this.comments$.update(c.id, { body, spoiler: this.editSpoiler() }).subscribe({
      next: (saved) => {
        this.comments.update((list) => list.map((x) => (x.id === saved.id ? saved : x)));
        this.editingId.set(null);
        this.posting.set(false);
      },
      error: (e) => {
        this.posting.set(false);
        this.toast.error(apiErrorMessage(e));
      },
    });
  }

  protected remove(c: Comment): void {
    this.confirmDeleteId.set(null);
    const previous = this.comments();
    this.comments.set(previous.filter((x) => x.id !== c.id));
    this.commentTotal.update((n) => Math.max(0, n - 1));
    this.comments$.remove(c.id).subscribe({
      next: () => this.toast.info('Comment deleted'),
      error: (e) => {
        this.comments.set(previous);
        this.commentTotal.update((n) => n + 1);
        this.toast.error(apiErrorMessage(e));
      },
    });
  }

  protected reveal(id: number): void {
    this.revealed.update((s) => new Set(s).add(id));
  }

  protected initial(name: string): string {
    return (name.trim()[0] ?? '?').toUpperCase();
  }

  // ---------- Reviews ----------

  protected loadReviews(page = 1): void {
    const kind = this.kind();
    const id = this.malId();
    this.reviewsLoading.set(true);
    this.reviewsError.set(false);
    this.jikan
      .reviews(kind, id, page)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (kind !== this.kind() || id !== this.malId()) return;
        this.reviewsLoading.set(false);
        if (!res) {
          this.reviewsError.set(true);
          return;
        }
        this.reviews.update((list) => (page === 1 ? res.data : [...list, ...res.data]));
        this.reviewPage.set(page);
        this.reviewsHasMore.set(!!res.pagination?.has_next_page);
        this.reviewsLoaded.set(true);
      });
  }

  protected moreReviews(): void {
    this.loadReviews(this.reviewPage() + 1);
  }

  protected toggleReview(id: number): void {
    this.expandedReviews.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected reviewText(r: Review): string {
    const text = r.review.trim();
    if (this.expandedReviews().has(r.mal_id) || text.length <= REVIEW_CLAMP) return text;
    return text.slice(0, REVIEW_CLAMP).replace(/\s+\S*$/, '') + '…';
  }

  protected progressLabel(r: Review): string | null {
    const n = this.kind() === 'manga' ? r.chapters_read : r.episodes_watched;
    return n ? `${n} ${this.kind() === 'manga' ? 'chapters read' : 'episodes watched'}` : null;
  }

  protected ago(iso: string): string {
    return timeAgo(iso);
  }
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.round((Date.now() - then) / 1000);
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return value < 10 && unit === 'second' ? 'just now' : rtf.format(-value, unit);
    value = Math.round(value / size);
  }
  return rtf.format(-value, 'year');
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
