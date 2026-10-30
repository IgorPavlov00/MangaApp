import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-toasts',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class]="t.kind" role="status">
          <span class="dot"></span>
          <p>{{ t.text }}</p>
          <button type="button" aria-label="Dismiss" (click)="toasts.dismiss(t.id)"><app-icon name="x" /></button>
        </div>
      }
    </div>
  `,
  styles: `
    .stack {
      position: fixed;
      z-index: 100;
      right: 16px;
      bottom: 16px;
      left: 16px;
      display: grid;
      justify-items: end;
      gap: 10px;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      width: min(400px, 100%);
      padding: 12px 10px 12px 16px;
      border-radius: var(--radius);
      border: 1px solid var(--line);
      background: var(--ink-3);
      box-shadow: var(--shadow);
      font-size: 0.9rem;
      font-weight: 600;
      animation: rise 0.25s ease-out;
    }
    p {
      flex: 1;
    }
    .dot {
      flex: none;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--muted);
    }
    .success .dot {
      background: var(--ok);
    }
    .error .dot {
      background: var(--danger);
    }
    .error {
      border-color: rgb(255 107 107 / 0.35);
    }
    button {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border: 0;
      border-radius: 50%;
      background: none;
      color: var(--muted);
      cursor: pointer;
    }
    button:hover {
      background: var(--ink-4);
      color: var(--paper);
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
    }
  `,
})
export class Toasts {
  protected readonly toasts = inject(ToastService);
}
