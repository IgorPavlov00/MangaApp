import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Media, MediaKind, coverUrl, displayTitle } from '../../core/jikan.models';
import {
  LIBRARY_STATUSES,
  LibraryEntry,
  LibraryService,
  LibraryStatus,
  SaveEntry,
  apiErrorMessage,
  statusLabel,
} from '../../core/library.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';

const RATING_LABELS = ['', 'Appalling', 'Horrible', 'Very bad', 'Bad', 'Average', 'Fine', 'Good', 'Very good', 'Great', 'Masterpiece'];

/** Add/edit this title in the signed-in user's library (stored by the Spring API). */
@Component({
  selector: 'app-library-panel',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './library-panel.html',
  styleUrl: './library-panel.scss',
})
export class LibraryPanel {
  readonly kind = input.required<MediaKind>();
  readonly media = input.required<Media>();

  protected readonly auth = inject(AuthService);
  private readonly library = inject(LibraryService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** undefined while loading, null when the title is not in the library. */
  protected readonly entry = signal<LibraryEntry | null | undefined>(undefined);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);

  protected readonly statuses = LIBRARY_STATUSES;
  protected readonly ratings = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  protected readonly ratingLabels = RATING_LABELS;
  protected readonly total = computed(() => (this.kind() === 'manga' ? this.media().chapters : this.media().episodes) ?? null);
  protected readonly unit = computed(() => (this.kind() === 'manga' ? 'chapters' : 'episodes'));
  protected readonly loginLink = computed(() => ({ redirect: this.router.url }));

  constructor() {
    effect(() => {
      const user = this.auth.user();
      const kind = this.kind();
      const id = this.media().mal_id;
      untracked(() => (user ? this.load(kind, id) : this.entry.set(undefined)));
    });
  }

  protected label(status: LibraryStatus): string {
    return statusLabel(status, this.kind());
  }

  protected load(kind: MediaKind, id: number): void {
    this.entry.set(undefined);
    this.loadError.set(null);
    this.library.get(kind, id).subscribe({
      next: (entry) => this.entry.set(entry),
      error: (e) => this.loadError.set(apiErrorMessage(e)),
    });
  }

  protected add(status: LibraryStatus): void {
    this.save({ status, rating: null, progress: null, favorite: false }, 'Added to your library');
  }

  protected setStatus(status: LibraryStatus): void {
    const patch: Partial<SaveEntry> = { status };
    const total = this.total();
    if (status === 'COMPLETED' && total) patch.progress = total;
    this.update(patch);
  }

  protected setRating(value: string): void {
    this.update({ rating: value ? Number(value) : null });
  }

  protected setProgress(value: string | number): void {
    const current = this.entry();
    if (!current) return;
    let progress = value === '' ? null : Math.max(0, Math.floor(Number(value)));
    if (progress !== null && Number.isNaN(progress)) return;
    const total = this.total();
    if (progress !== null && total) progress = Math.min(progress, total);
    if (progress === current.progress) return;

    const patch: Partial<SaveEntry> = { progress };
    if (total && progress === total && current.status !== 'COMPLETED') {
      patch.status = 'COMPLETED';
      this.toast.success(`Finished! Marked as completed.`);
    } else if (progress && current.status === 'PLANNING') {
      patch.status = 'IN_PROGRESS';
    }
    this.update(patch);
  }

  protected increment(): void {
    this.setProgress((this.entry()?.progress ?? 0) + 1);
  }

  protected toggleFavorite(): void {
    const current = this.entry();
    if (current) this.update({ favorite: !current.favorite });
  }

  protected remove(): void {
    const current = this.entry();
    if (!current) return;
    this.saving.set(true);
    this.entry.set(null);
    this.library.remove(this.kind(), this.media().mal_id).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.info('Removed from your library');
      },
      error: (e) => {
        this.saving.set(false);
        this.entry.set(current);
        this.toast.error(apiErrorMessage(e));
      },
    });
  }

  private update(patch: Partial<SaveEntry>): void {
    const current = this.entry();
    if (!current) return;
    const { status, rating, progress, favorite } = current;
    this.save({ status, rating, progress, favorite, ...patch });
  }

  /** Optimistic: show the change immediately and roll back if the API rejects it. */
  private save(fields: Omit<SaveEntry, 'title' | 'imageUrl'>, successMessage?: string): void {
    const media = this.media();
    const previous = this.entry();
    const body: SaveEntry = { title: displayTitle(media), imageUrl: coverUrl(media.images) || null, ...fields };
    const optimistic = {
      ...(previous ?? { createdAt: '', updatedAt: '' }),
      ...body,
      mediaType: this.kind() === 'manga' ? 'MANGA' : 'ANIME',
      malId: media.mal_id,
    } as LibraryEntry;
    this.entry.set(optimistic);
    this.saving.set(true);
    this.library.save(this.kind(), media.mal_id, body).subscribe({
      next: (saved) => {
        this.entry.set(saved);
        this.saving.set(false);
        if (successMessage) this.toast.success(successMessage);
      },
      error: (e) => {
        this.entry.set(previous);
        this.saving.set(false);
        this.toast.error(apiErrorMessage(e));
      },
    });
  }
}
