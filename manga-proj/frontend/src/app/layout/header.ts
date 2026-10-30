import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ApiStatus } from '../core/api.interceptor';
import { ToastService } from '../core/toast.service';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeAll()', '(document:click)': 'onDocumentClick($event)' },
  template: `
    <header class="bar">
      <div class="container inner">
        <a routerLink="/" class="brand" aria-label="AniMan home">
          <span class="stamp">漫</span>
          <span class="display word">AniMan</span>
        </a>

        <nav class="nav" [class.open]="menuOpen()" aria-label="Main">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/manga" routerLinkActive="active">Manga</a>
          <a routerLink="/anime" routerLinkActive="active">Anime</a>
          <a routerLink="/library" routerLinkActive="active">My library</a>
        </nav>

        <form class="search" role="search" (submit)="search($event)">
          <app-icon name="search" />
          <label class="sr-only" for="global-search">Search manga</label>
          <input #searchInput id="global-search" class="input" type="search" placeholder="Search manga…" autocomplete="off" />
        </form>

        <div class="end">
          @if (auth.user()) {
            <div class="account">
              <button
                class="avatar"
                type="button"
                (click)="toggleAccount($event)"
                [attr.aria-expanded]="accountOpen()"
                aria-haspopup="menu"
                [attr.aria-label]="'Account menu for ' + auth.displayName()"
              >
                {{ auth.displayName().charAt(0).toUpperCase() }}
              </button>
              @if (accountOpen()) {
                <div class="menu" role="menu">
                  <p class="who">
                    <strong>{{ auth.displayName() }}</strong>
                    <span class="muted">{{ auth.user()?.email }}</span>
                  </p>
                  <a role="menuitem" routerLink="/library"><app-icon name="bookmark" /> My library</a>
                  <a role="menuitem" routerLink="/account"><app-icon name="user" /> Account</a>
                  <button role="menuitem" type="button" (click)="signOut()"><app-icon name="log-out" /> Sign out</button>
                </div>
              }
            </div>
          } @else {
            <a class="btn btn-primary btn-sm signin" routerLink="/login">Sign in</a>
          }
          <button
            class="btn btn-icon btn-ghost burger"
            type="button"
            (click)="toggleMenu($event)"
            [attr.aria-expanded]="menuOpen()"
            aria-label="Menu"
          >
            <app-icon [name]="menuOpen() ? 'x' : 'menu'" />
          </button>
        </div>
      </div>
      @if (api.waking()) {
        <div class="waking" role="status">
          <span class="spinner"></span>
          Waking up the server. The free hosting tier sleeps when idle, so this can take up to a minute.
        </div>
      }
    </header>
  `,
  styleUrl: './header.scss',
})
export class Header {
  protected readonly auth = inject(AuthService);
  protected readonly api = inject(ApiStatus);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly menuOpen = signal(false);
  protected readonly accountOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeAll());
  }

  protected search(event: Event): void {
    event.preventDefault();
    const input = this.searchInput().nativeElement;
    const q = input.value.trim();
    if (!q) return;
    this.router.navigate(['/manga'], { queryParams: { q } });
    input.value = '';
    input.blur();
  }

  protected toggleMenu(event: Event): void {
    event.stopPropagation();
    this.accountOpen.set(false);
    this.menuOpen.update((v) => !v);
  }

  protected toggleAccount(event: Event): void {
    event.stopPropagation();
    this.menuOpen.set(false);
    this.accountOpen.update((v) => !v);
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    this.toast.info('Signed out. See you soon!');
    this.router.navigateByUrl('/');
  }

  protected closeAll(): void {
    this.menuOpen.set(false);
    this.accountOpen.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.closeAll();
  }
}
