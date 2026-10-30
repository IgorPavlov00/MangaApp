import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { JikanService } from './jikan.service';

describe('JikanService', () => {
  let service: JikanService;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(JikanService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => vi.useRealTimers());

  it('spaces requests out to respect the rate limit', () => {
    service.details('manga', 1).subscribe();
    service.details('manga', 2).subscribe();

    vi.advanceTimersByTime(0);
    expect(http.match(() => true).length).toBe(1);
    vi.advanceTimersByTime(400);
    expect(http.match(() => true).length).toBe(1); // the second one, now released
  });

  it('serves repeated requests from cache', () => {
    let calls = 0;
    service.details('anime', 5).subscribe(() => calls++);
    vi.advanceTimersByTime(0);
    http.expectOne('https://api.jikan.moe/v4/anime/5/full').flush({ data: { mal_id: 5 } });

    service.details('anime', 5).subscribe(() => calls++);
    vi.advanceTimersByTime(1000);
    http.expectNone('https://api.jikan.moe/v4/anime/5/full');
    expect(calls).toBe(2);
  });

  it('drops failed responses from the cache so the next visit retries', () => {
    service.details('manga', 9).subscribe({ error: () => {} });
    vi.advanceTimersByTime(0);
    http.expectOne('https://api.jikan.moe/v4/manga/9/full').flush('nope', { status: 404, statusText: 'Not Found' });

    service.details('manga', 9).subscribe();
    vi.advanceTimersByTime(1000);
    http.expectOne('https://api.jikan.moe/v4/manga/9/full');
  });
});
