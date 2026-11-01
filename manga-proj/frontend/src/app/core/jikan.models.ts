/** Types for the parts of the Jikan v4 API (https://docs.api.jikan.moe) that the app uses. */

export type MediaKind = 'manga' | 'anime';

export interface JikanImages {
  jpg: { image_url: string; small_image_url?: string; large_image_url?: string };
  webp?: { image_url: string; small_image_url?: string; large_image_url?: string };
}

export interface NamedRef {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface DateRange {
  from: string | null;
  to: string | null;
  string?: string;
}

export interface Media {
  mal_id: number;
  url: string;
  images: JikanImages;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string | null;
  status: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  genres: NamedRef[];
  themes: NamedRef[];
  demographics: NamedRef[];
  year?: number | null;
  // Manga
  chapters?: number | null;
  volumes?: number | null;
  published?: DateRange;
  authors?: NamedRef[];
  serializations?: NamedRef[];
  // Anime
  episodes?: number | null;
  aired?: DateRange;
  season?: string | null;
  duration?: string | null;
  rating?: string | null;
  source?: string | null;
  studios?: NamedRef[];
  trailer?: { youtube_id: string | null; embed_url: string | null };
  relations?: { relation: string; entry: NamedRef[] }[];
  external?: { name: string; url: string }[];
}

export interface Pagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page?: number;
  items?: { count: number; total: number; per_page: number };
}

export interface Page<T> {
  data: T[];
  pagination?: Pagination;
}

export interface Single<T> {
  data: T;
}

export interface CharacterRole {
  character: { mal_id: number; name: string; images: JikanImages };
  role: string;
  voice_actors?: { person: { mal_id: number; name: string; images: JikanImages }; language: string }[];
}

export interface Recommendation {
  entry: { mal_id: number; title: string; images: JikanImages };
  votes: number;
}

/** A user review from /{kind}/{id}/reviews. */
export interface Review {
  mal_id: number;
  url: string;
  date: string;
  review: string;
  score: number | null;
  tags: string[];
  is_spoiler: boolean;
  is_preliminary: boolean;
  chapters_read?: number | null;
  episodes_watched?: number | null;
  reactions?: { overall: number };
  user: { username: string; url: string; images?: JikanImages };
}

export interface Genre {
  mal_id: number;
  name: string;
  count: number;
}

export interface CharacterFull {
  mal_id: number;
  name: string;
  name_kanji: string | null;
  nicknames: string[];
  favorites: number;
  about: string | null;
  images: JikanImages;
  anime: { role: string; anime: { mal_id: number; title: string; images: JikanImages } }[];
  manga: { role: string; manga: { mal_id: number; title: string; images: JikanImages } }[];
  voices: { language: string; person: { mal_id: number; name: string; images: JikanImages } }[];
}

export interface SearchParams {
  q?: string;
  genres?: string;
  type?: string;
  status?: string;
  min_score?: number;
  order_by?: string;
  sort?: 'asc' | 'desc';
  page?: number;
}

export function coverUrl(images: JikanImages | undefined, size: 'large' | 'normal' = 'large'): string {
  if (!images) return '';
  const pick = (set?: JikanImages['jpg']) =>
    set && (size === 'large' ? set.large_image_url || set.image_url : set.image_url);
  return pick(images.webp) || pick(images.jpg) || '';
}

export function displayTitle(m: Pick<Media, 'title' | 'title_english'>): string {
  return m.title_english || m.title;
}
