import { ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

/** A titled, horizontally scrolling shelf of cards with skeletons while loading. */
@Component({
  selector: 'app-media-row',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="section-head">
        <div>
          <h2 class="section-title">{{ heading() }}</h2>
          @if (subheading()) {
            <p class="muted sub">{{ subheading() }}</p>
          }
        </div>
        <div class="actions">
          @if (seeAll()) {
            <a class="link see-all" [routerLink]="seeAll()" [queryParams]="seeAllParams()">See all</a>
          }
          <button class="btn btn-icon btn-sm nav" type="button" aria-label="Scroll left" (click)="scroll(-1)">
            <app-icon name="chevron-left" />
          </button>
          <button class="btn btn-icon btn-sm nav" type="button" aria-label="Scroll right" (click)="scroll(1)">
            <app-icon name="chevron-right" />
          </button>
        </div>
      </div>
      @if (error()) {
        <p class="callout error">{{ error() }}</p>
      } @else {
        <div class="track" #track>
          @if (loading()) {
            @for (i of placeholders; track i) {
              <div class="ph">
                <div class="skeleton cover"></div>
                <div class="skeleton line"></div>
                <div class="skeleton line short"></div>
              </div>
            }
          } @else {
            <ng-content />
          }
        </div>
      }
    </section>
  `,
  styles: `
    .sub {
      margin-top: 4px;
      font-size: 0.88rem;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .see-all {
      margin-right: 6px;
      font-size: 0.9rem;
    }
    .nav {
      width: 34px;
    }
    @media (max-width: 640px) {
      .nav {
        display: none;
      }
    }
    .track {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: clamp(132px, 15vw, 168px);
      gap: 18px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-padding-inline: var(--gutter);
      padding: 6px var(--gutter) 14px;
      margin-inline: calc(var(--gutter) * -1);
      scrollbar-width: none;
      /* Soft edges where the shelf bleeds into the page gutter */
      mask-image: linear-gradient(to right, transparent, #000 var(--gutter), #000 calc(100% - var(--gutter)), transparent);
    }
    .track::-webkit-scrollbar {
      display: none;
    }
    .ph {
      display: grid;
      gap: 8px;
    }
    .ph .cover {
      aspect-ratio: 2 / 3;
      border-radius: var(--radius);
    }
    .ph .line {
      height: 12px;
    }
    .ph .short {
      width: 60%;
    }
  `,
})
export class MediaRow {
  readonly heading = input.required<string>();
  readonly subheading = input<string>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly seeAll = input<string | null>(null);
  readonly seeAllParams = input<Record<string, string | number> | null>(null);

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  protected readonly placeholders = Array.from({ length: 8 }, (_, i) => i);

  protected scroll(direction: 1 | -1): void {
    const el = this.track()?.nativeElement;
    el?.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
  }
}
