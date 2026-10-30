import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', title: 'AniMan · Anime & Manga Finder', loadComponent: () => import('./pages/home/home') },
  { path: 'manga', title: 'Browse manga · AniMan', data: { kind: 'manga' }, loadComponent: () => import('./pages/browse/browse') },
  { path: 'anime', title: 'Browse anime · AniMan', data: { kind: 'anime' }, loadComponent: () => import('./pages/browse/browse') },
  { path: 'manga/:id', data: { kind: 'manga' }, loadComponent: () => import('./pages/detail/detail') },
  { path: 'anime/:id', data: { kind: 'anime' }, loadComponent: () => import('./pages/detail/detail') },
  { path: 'character/:id', loadComponent: () => import('./pages/character/character') },
  {
    path: 'library',
    title: 'My library · AniMan',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/library/library'),
  },
  {
    path: 'account',
    title: 'Account · AniMan',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account/account'),
  },
  {
    path: 'login',
    title: 'Sign in · AniMan',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login'),
  },
  {
    path: 'signup',
    title: 'Create account · AniMan',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/signup'),
  },
  { path: 'forgot-password', title: 'Reset password · AniMan', loadComponent: () => import('./pages/auth/forgot-password') },
  { path: 'reset-password', title: 'Choose a new password · AniMan', loadComponent: () => import('./pages/auth/reset-password') },
  { path: 'auth/callback', title: 'Confirming… · AniMan', loadComponent: () => import('./pages/auth/callback') },
  // Old URLs from the previous version of the site
  { path: 'browsemanga', redirectTo: 'manga' },
  { path: 'home', redirectTo: '' },
  { path: 'confirm', redirectTo: 'auth/callback' },
  { path: '**', title: 'Not found · AniMan', loadComponent: () => import('./pages/not-found') },
];
