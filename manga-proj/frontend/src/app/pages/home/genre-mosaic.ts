import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FEATURED_GENRES } from './genres';
import { DESKTOP_LAYOUT, MOBILE_LAYOUT, buildMosaic } from './mosaic-geometry';

let instances = 0;

const DESKTOP_PIECES = buildMosaic(DESKTOP_LAYOUT);
const MOBILE_PIECES = buildMosaic(MOBILE_LAYOUT);

/** Genre picker laid out as an interlocking polygon collage (see mosaic-geometry.ts). */
@Component({
  selector: 'app-genre-mosaic',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Rounded-corner clip shapes, one per piece (objectBoundingBox units, so they scale) -->
    <svg class="defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        @for (tile of tiles(); track tile.genre.id) {
          <clipPath [attr.id]="clipId(tile.genre.id)" clipPathUnits="objectBoundingBox">
            <path [attr.d]="tile.piece.path" />
          </clipPath>
        }
      </defs>
    </svg>
    <div class="mosaic" [style.aspect-ratio]="ratio()">
      @for (tile of tiles(); track tile.genre.id) {
        <div class="cell">
          <a
            class="piece"
            [style.clip-path]="'url(#' + clipId(tile.genre.id) + ')'"
            [routerLink]="['/manga']"
            [queryParams]="{ genres: tile.genre.id }"
            [attr.aria-label]="'Browse ' + tile.genre.name + ' manga'"
          >
            <span
              class="art"
              [style.left.%]="tile.piece.box.left"
              [style.top.%]="tile.piece.box.top"
              [style.width.%]="tile.piece.box.width"
              [style.height.%]="tile.piece.box.height"
            >
              <img [src]="'genres/' + tile.genre.image + '.webp'" alt="" loading="lazy" decoding="async" [style.object-position]="tile.genre.focus" />
            </span>
            <span
              class="label"
              [style.left.%]="tile.piece.label.left"
              [style.bottom.%]="tile.piece.label.bottom"
              [style.max-width.%]="tile.piece.label.maxWidth"
            >
              <span class="bar" aria-hidden="true"></span>{{ tile.genre.name }}
            </span>
          </a>
        </div>
      }
    </div>
  `,
  styleUrl: './genre-mosaic.scss',
})
export class GenreMosaic {
  private readonly mobile = signal(false);
  /** Clip path ids must be unique in the document. */
  private readonly uid = `gm${instances++}`;

  protected readonly tiles = computed(() => {
    const pieces = this.mobile() ? MOBILE_PIECES : DESKTOP_PIECES;
    return FEATURED_GENRES.map((genre, i) => ({ genre, piece: pieces[i] }));
  });
  protected readonly ratio = computed(() => {
    const layout = this.mobile() ? MOBILE_LAYOUT : DESKTOP_LAYOUT;
    return `${layout.width} / ${layout.height}`;
  });

  protected clipId(genreId: number): string {
    return `${this.uid}-${genreId}`;
  }

  constructor() {
    const query = window.matchMedia('(max-width: 720px)');
    const update = () => this.mobile.set(query.matches);
    update();
    query.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', update));
  }
}
