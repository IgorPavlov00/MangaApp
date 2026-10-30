import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Title, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { JikanService } from '../../core/jikan.service';
import { CharacterRole, Media, MediaKind, Recommendation, coverUrl, displayTitle } from '../../core/jikan.models';
import { Icon } from '../../shared/icon';
import { MediaCard } from '../../shared/media-card';
import { MediaRow } from '../../shared/media-row';
import { LibraryPanel } from './library-panel';

interface InfoRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-detail',
  imports: [RouterLink, DecimalPipe, Icon, MediaCard, MediaRow, LibraryPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detail.html',
  styleUrl: './detail.scss',
})
export default class Detail {
  private readonly jikan = inject(JikanService);
  private readonly title = inject(Title);
  private readonly sanitizer = inject(DomSanitizer);

  /** Route data and the :id param, bound by withComponentInputBinding. */
  readonly kind = input.required<MediaKind>();
  readonly id = input.required<string>();

  protected readonly media = signal<Media | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly characters = signal<CharacterRole[]>([]);
  protected readonly charactersLoading = signal(true);
  protected readonly recommendations = signal<Recommendation[]>([]);
  protected readonly recsLoading = signal(true);
  protected readonly expanded = signal(false);
  protected readonly playTrailer = signal(false);

  protected readonly coverUrl = coverUrl;
  protected readonly displayTitle = displayTitle;

  protected readonly synopsis = computed(() =>
    (this.media()?.synopsis ?? '').replace(/\s*\[Written by MAL Rewrite\]\s*$/i, '').trim(),
  );
  protected readonly longSynopsis = computed(() => this.synopsis().length > 650);
  protected readonly tags = computed(() => {
    const m = this.media();
    return m ? [...m.genres, ...m.themes, ...m.demographics] : [];
  });
  protected readonly altTitles = computed(() => {
    const m = this.media();
    if (!m) return [];
    const main = displayTitle(m);
    return [m.title, m.title_japanese].filter((t): t is string => !!t && t !== main);
  });
  protected readonly info = computed<InfoRow[]>(() => {
    const m = this.media();
    if (!m) return [];
    const rows: (InfoRow | null)[] =
      this.kind() === 'manga'
        ? [
            row('Format', m.type),
            row('Status', m.status),
            row('Chapters', m.chapters),
            row('Volumes', m.volumes),
            row('Published', m.published?.string),
            row('Authors', names(m.authors)),
            row('Serialization', names(m.serializations)),
          ]
        : [
            row('Format', m.type),
            row('Status', m.status),
            row('Episodes', m.episodes),
            row('Aired', m.aired?.string),
            row('Season', m.season ? `${capitalize(m.season)} ${m.year ?? ''}` : null),
            row('Studios', names(m.studios)),
            row('Source', m.source),
            row('Duration', m.duration),
            row('Rating', m.rating),
          ];
    return rows.filter((r): r is InfoRow => r !== null);
  });
  /** Related manga/anime (sequels, adaptations, …), skipping other entry types MAL lists. */
  protected readonly related = computed(() =>
    (this.media()?.relations ?? [])
      .map((r) => ({ relation: r.relation, entries: r.entry.filter((e) => e.type === 'manga' || e.type === 'anime') }))
      .filter((r) => r.entries.length),
  );
  protected readonly trailerUrl = computed<SafeResourceUrl | null>(() => {
    const id = this.media()?.trailer?.youtube_id;
    return id
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`)
      : null;
  });

  constructor() {
    const key = computed(() => ({ kind: this.kind(), id: Number(this.id()) }));
    toObservable(key)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
          this.expanded.set(false);
          this.playTrailer.set(false);
          this.characters.set([]);
          this.recommendations.set([]);
          this.charactersLoading.set(true);
          this.recsLoading.set(true);
        }),
        switchMap(({ kind, id }) =>
          Number.isInteger(id) && id > 0
            ? this.jikan.details(kind, id).pipe(catchError(() => of(null)))
            : of(null),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        const media = res?.data ?? null;
        this.media.set(media);
        this.loading.set(false);
        if (!media) {
          this.error.set(`We couldn't load this ${this.kind()}. It may not exist, or MyAnimeList is busy. Try again in a moment.`);
          this.title.setTitle('Not found · AniMan');
          return;
        }
        this.title.setTitle(`${displayTitle(media)} · AniMan`);
        this.loadExtras(this.kind(), media.mal_id);
      });
  }

  private loadExtras(kind: MediaKind, id: number): void {
    this.jikan
      .characters(kind, id)
      .pipe(catchError(() => of({ data: [] as CharacterRole[] })))
      .subscribe((res) => {
        if (this.media()?.mal_id !== id) return;
        const sorted = [...res.data].sort((a, b) => Number(b.role === 'Main') - Number(a.role === 'Main'));
        this.characters.set(sorted.slice(0, 12));
        this.charactersLoading.set(false);
      });
    this.jikan
      .recommendations(kind, id)
      .pipe(catchError(() => of({ data: [] as Recommendation[] })))
      .subscribe((res) => {
        if (this.media()?.mal_id !== id) return;
        this.recommendations.set(res.data.slice(0, 18));
        this.recsLoading.set(false);
      });
  }
}

function row(label: string, value: string | number | null | undefined): InfoRow | null {
  return value === null || value === undefined || value === '' || value === '?' ? null : { label, value: String(value) };
}

function names(list?: { name: string }[]): string | null {
  return list?.length ? list.map((x) => x.name).join(', ') : null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
