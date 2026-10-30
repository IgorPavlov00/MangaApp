import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { MediaKind } from '../../core/jikan.models';
import {
  ApiRecommendation,
  LIBRARY_STATUSES,
  LibraryEntry,
  LibraryService,
  LibraryStatus,
  apiErrorMessage,
  statusLabel,
} from '../../core/library.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { MediaCard } from '../../shared/media-card';
import { MediaRow } from '../../shared/media-row';

type StatusFilter = LibraryStatus | 'ALL' | 'FAVORITES';
type SortKey = 'updated' | 'title' | 'rating';

@Component({
  selector: 'app-library',
  imports: [RouterLink, DecimalPipe, Icon, MediaCard, MediaRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './library.html',
  styleUrl: './library.scss',
})
export default class Library {
  protected readonly auth = inject(AuthService);
  private readonly library = inject(LibraryService);
  private readonly toast = inject(ToastService);

  protected readonly entries = signal<LibraryEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly kind = signal<MediaKind>('manga');
  protected readonly filter = signal<StatusFilter>('ALL');
  protected readonly sort = signal<SortKey>('updated');

  protected readonly recs = signal<Partial<Record<MediaKind, ApiRecommendation[]>>>({});
  protected readonly recsLoading = signal(false);
  protected readonly recsError = signal<string | null>(null);

  protected readonly statuses = LIBRARY_STATUSES;

  protected readonly ofKind = computed(() => {
    const type = this.kind() === 'manga' ? 'MANGA' : 'ANIME';
    return this.entries().filter((e) => e.mediaType === type);
  });
  protected readonly counts = computed(() => {
    const counts: Record<string, number> = { ALL: 0, FAVORITES: 0 };
    for (const s of LIBRARY_STATUSES) counts[s] = 0;
    for (const e of this.ofKind()) {
      counts['ALL']++;
      counts[e.status]++;
      if (e.favorite) counts['FAVORITES']++;
    }
    return counts;
  });
  protected readonly kindCounts = computed(() => ({
    manga: this.entries().filter((e) => e.mediaType === 'MANGA').length,
    anime: this.entries().filter((e) => e.mediaType === 'ANIME').length,
  }));
  protected readonly averageRating = computed(() => {
    const rated = this.ofKind().filter((e) => e.rating);
    return rated.length ? rated.reduce((sum, e) => sum + e.rating!, 0) / rated.length : null;
  });
  protected readonly visible = computed(() => {
    const filter = this.filter();
    const list = this.ofKind().filter((e) =>
      filter === 'ALL' ? true : filter === 'FAVORITES' ? e.favorite : e.status === filter,
    );
    const sort = this.sort();
    return [...list].sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title)
        : sort === 'rating'
          ? (b.rating ?? 0) - (a.rating ?? 0)
          : b.updatedAt.localeCompare(a.updatedAt),
    );
  });
  protected readonly currentRecs = computed(() => this.recs()[this.kind()] ?? []);

  constructor() {
    this.reload();
    // Load recommendations for the visible tab once the library is known (they depend on it).
    effect(() => {
      const kind = this.kind();
      const ready = !this.loading() && !this.error();
      const count = this.ofKind().length;
      untracked(() => {
        if (ready && count && !this.recs()[kind]) this.loadRecs(kind);
      });
    });
  }

  protected label(status: LibraryStatus): string {
    return statusLabel(status, this.kind());
  }

  protected reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.library.list().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
        // Open on whichever tab has something in it.
        if (!entries.some((e) => e.mediaType === 'MANGA') && entries.some((e) => e.mediaType === 'ANIME')) {
          this.kind.set('anime');
        }
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.loading.set(false);
      },
    });
  }

  protected switchKind(kind: MediaKind): void {
    this.kind.set(kind);
    this.filter.set('ALL');
  }

  protected loadRecs(kind: MediaKind): void {
    this.recsLoading.set(true);
    this.recsError.set(null);
    this.library.recommendations(kind, 18).subscribe({
      next: (list) => {
        this.recs.update((r) => ({ ...r, [kind]: list }));
        this.recsLoading.set(false);
      },
      error: (e) => {
        this.recsError.set(apiErrorMessage(e));
        this.recsLoading.set(false);
      },
    });
  }

  protected changeStatus(entry: LibraryEntry, status: LibraryStatus): void {
    const { title, imageUrl, rating, progress, favorite } = entry;
    this.replace({ ...entry, status });
    this.library.save(this.kindOf(entry), entry.malId, { title, imageUrl, status, rating, progress, favorite }).subscribe({
      next: (saved) => {
        this.replace(saved);
        this.toast.success(`Moved to ${statusLabel(status, this.kindOf(entry))}`);
      },
      error: (e) => {
        this.replace(entry);
        this.toast.error(apiErrorMessage(e));
      },
    });
  }

  protected remove(entry: LibraryEntry): void {
    this.entries.update((list) => list.filter((e) => e !== entry && !(e.malId === entry.malId && e.mediaType === entry.mediaType)));
    this.library.remove(this.kindOf(entry), entry.malId).subscribe({
      next: () => {
        this.toast.info(`Removed ${entry.title}`);
        // Recommendations exclude library titles, so refresh them next time.
        this.recs.update((r) => ({ ...r, [this.kindOf(entry)]: undefined }));
      },
      error: (e) => {
        this.entries.update((list) => [entry, ...list]);
        this.toast.error(apiErrorMessage(e));
      },
    });
  }

  protected kindOf(entry: LibraryEntry): MediaKind {
    return entry.mediaType === 'MANGA' ? 'manga' : 'anime';
  }

  protected progressText(entry: LibraryEntry): string | null {
    if (!entry.progress) return null;
    return `${entry.mediaType === 'MANGA' ? 'Ch.' : 'Ep.'} ${entry.progress}`;
  }

  private replace(entry: LibraryEntry): void {
    this.entries.update((list) =>
      list.map((e) => (e.malId === entry.malId && e.mediaType === entry.mediaType ? entry : e)),
    );
  }
}
