import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-pagination',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (last() > 1) {
      <nav class="pager" aria-label="Pagination">
        <button class="btn btn-icon" type="button" [disabled]="page() <= 1" (click)="go(page() - 1)" aria-label="Previous page">
          <app-icon name="chevron-left" />
        </button>
        @for (p of pages(); track $index) {
          @if (p === null) {
            <span class="gap">…</span>
          } @else {
            <button
              class="btn btn-icon num"
              type="button"
              [class.btn-primary]="p === page()"
              [attr.aria-current]="p === page() ? 'page' : null"
              (click)="go(p)"
            >
              {{ p }}
            </button>
          }
        }
        <button class="btn btn-icon" type="button" [disabled]="page() >= last()" (click)="go(page() + 1)" aria-label="Next page">
          <app-icon name="chevron-right" />
        </button>
      </nav>
    }
  `,
  styles: `
    .pager {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 6px;
      margin-top: 40px;
    }
    .num {
      font-variant-numeric: tabular-nums;
    }
    .gap {
      width: 24px;
      text-align: center;
      color: var(--faint);
    }
    @media (max-width: 480px) {
      .btn-icon {
        width: 36px;
        min-height: 36px;
      }
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly last = input.required<number>();
  readonly pageChange = output<number>();

  /** Current page with neighbours, first and last, and gaps in between: 1 … 4 5 6 … 20 */
  protected readonly pages = computed(() => {
    const page = this.page();
    const last = this.last();
    const wanted = new Set([1, last, page - 1, page, page + 1].filter((p) => p >= 1 && p <= last));
    const sorted = [...wanted].sort((a, b) => a - b);
    const out: (number | null)[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
      out.push(p);
    });
    return out;
  });

  protected go(page: number): void {
    if (page >= 1 && page <= this.last() && page !== this.page()) this.pageChange.emit(page);
  }
}
