import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

/** Poster card used everywhere a title is listed. Pass plain fields so it works for Jikan and API data. */
@Component({
  selector: 'app-media-card',
  imports: [RouterLink, Icon, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="card" [routerLink]="link()">
      <div class="cover">
        @if (image()) {
          <img [src]="image()" [alt]="title()" loading="lazy" decoding="async" />
        } @else {
          <div class="no-cover display">{{ title().charAt(0) }}</div>
        }
        @if (score()) {
          <span class="badge score"><app-icon name="star" [filled]="true" />{{ score() | number: '1.1-1' }}</span>
        }
        @if (rank()) {
          <span class="rank display">{{ rank() }}</span>
        }
        <ng-content select="[cover]" />
      </div>
      <h3 class="title">{{ title() }}</h3>
      @if (meta()) {
        <p class="meta">{{ meta() }}</p>
      }
      <ng-content />
    </a>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
      scroll-snap-align: start;
    }
    .card {
      display: grid;
      gap: 8px;
      outline-offset: 4px;
    }
    .cover {
      position: relative;
      aspect-ratio: 2 / 3;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--ink-3);
      box-shadow: 0 0 0 1px rgb(255 255 255 / 0.04);
      transition:
        transform 0.25s ease,
        box-shadow 0.25s ease;
    }
    .cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .card:hover .cover {
      transform: translateY(-4px);
      box-shadow:
        0 0 0 1px rgb(255 90 54 / 0.55),
        var(--shadow);
    }
    .card:hover img {
      transform: scale(1.045);
    }
    .no-cover {
      display: grid;
      place-items: center;
      height: 100%;
      font-size: 3rem;
      color: var(--faint);
      background: var(--tone), var(--ink-3);
    }
    .badge {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgb(12 11 16 / 0.82);
      backdrop-filter: blur(6px);
      font-size: 0.78rem;
    }
    .rank {
      position: absolute;
      right: 6px;
      bottom: -6px;
      font-size: 2.6rem;
      line-height: 1;
      color: var(--paper);
      -webkit-text-stroke: 2px var(--ink);
      paint-order: stroke fill;
      text-shadow: 0 4px 16px rgb(0 0 0 / 0.6);
    }
    .title {
      font-size: 0.92rem;
      font-weight: 700;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card:hover .title {
      color: var(--accent-strong);
    }
    .meta {
      margin-top: -4px;
      font-size: 0.78rem;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
})
export class MediaCard {
  readonly kind = input.required<'manga' | 'anime'>();
  readonly malId = input.required<number>();
  readonly title = input.required<string>();
  readonly image = input<string | null | undefined>(null);
  readonly score = input<number | null | undefined>(null);
  readonly meta = input<string | null>(null);
  readonly rank = input<number | null>(null);

  protected readonly link = computed(() => ['/', this.kind(), this.malId()]);
}
