import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, retry, throwError, timer } from 'rxjs';
import {
  CharacterFull,
  CharacterRole,
  Genre,
  JikanImages,
  Media,
  MediaKind,
  NamedRef,
  Page,
  Recommendation,
  Review,
  SearchParams,
  Single,
} from './jikan.models';

/**
 * Backup catalogue source used when Jikan is unavailable. Queries AniList's GraphQL API and maps the
 * results into the same Jikan-shaped models, keyed by MyAnimeList ids, so pages and links don't change.
 * AniList-only ids that have no MAL equivalent (characters, voice actors) are encoded as negative numbers.
 */
@Injectable({ providedIn: 'root' })
export class AniListService {
  private readonly http = inject(HttpClient);

  top(kind: MediaKind, filter: string | undefined, limit: number): Observable<Page<Media>> {
    const vars: Record<string, unknown> = { type: type(kind), perPage: limit, page: 1 };
    if (filter === 'bypopularity') {
      vars['sort'] = ['POPULARITY_DESC'];
    } else if (filter === 'upcoming') {
      vars['status'] = 'NOT_YET_RELEASED';
      vars['sort'] = ['POPULARITY_DESC'];
    } else {
      if (filter === 'publishing' || filter === 'airing') vars['status'] = 'RELEASING';
      vars['sort'] = ['SCORE_DESC'];
      // Without a floor, SCORE_DESC surfaces obscure titles with a handful of votes.
      vars['popularityGreater'] = filter ? 5000 : 15000;
    }
    return this.page(kind, vars);
  }

  seasonNow(limit: number): Observable<Page<Media>> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const season = month === 12 || month <= 2 ? 'WINTER' : month <= 5 ? 'SPRING' : month <= 8 ? 'SUMMER' : 'FALL';
    const year = month === 12 ? now.getFullYear() + 1 : now.getFullYear();
    return this.page('anime', { type: 'ANIME', season, seasonYear: year, sort: ['POPULARITY_DESC'], perPage: limit, page: 1 });
  }

  search(kind: MediaKind, p: SearchParams, perPage: number): Observable<Page<Media>> {
    const vars: Record<string, unknown> = { type: type(kind), perPage, page: p.page ?? 1 };
    if (p.q) vars['search'] = p.q;
    const genres: string[] = [];
    const tags: string[] = [];
    for (const id of (p.genres ?? '').split(',').filter(Boolean).map(Number)) {
      const g = genreFor(kind, id);
      if (g?.tag) tags.push(g.name);
      else if (g) genres.push(g.anilist ?? g.name);
    }
    if (genres.length) vars['genres'] = genres;
    if (tags.length) vars['tags'] = tags;
    if (p.type) Object.assign(vars, FORMAT_FILTER[p.type] ?? {});
    if (p.status) vars['status'] = STATUS_FILTER[p.status];
    if (p.min_score) vars['scoreGreater'] = p.min_score * 10 - 1;
    vars['sort'] = [ORDER[p.order_by ?? 'members'] ?? 'POPULARITY_DESC'];
    return this.page(kind, vars);
  }

  genres(kind: MediaKind): Observable<Page<Genre>> {
    const list = GENRES.filter((g) => !g.only || g.only === kind).map((g) => ({ mal_id: g.ids[kind], name: g.name, count: 0 }));
    return new Observable((sub) => {
      sub.next({ data: list });
      sub.complete();
    });
  }

  details(kind: MediaKind, malId: number): Observable<Single<Media>> {
    return this.query<{ Media: AlMedia }>(DETAILS_QUERY, { idMal: malId, type: type(kind) }).pipe(
      map((d) => ({ data: toMedia(d.Media, kind) })),
    );
  }

  characters(kind: MediaKind, malId: number): Observable<Page<CharacterRole>> {
    return this.query<{ Media: { characters: { edges: AlCharacterEdge[] } } }>(CHARACTERS_QUERY, {
      idMal: malId,
      type: type(kind),
    }).pipe(
      map((d) => ({
        data: d.Media.characters.edges.map((e) => ({
          character: { mal_id: -e.node.id, name: e.node.name.full, images: img(e.node.image) },
          role: titleCase(e.role),
        })),
      })),
    );
  }

  recommendations(kind: MediaKind, malId: number): Observable<Page<Recommendation>> {
    return this.query<{ Media: { recommendations: { nodes: AlRecommendation[] } } }>(RECOMMENDATIONS_QUERY, {
      idMal: malId,
      type: type(kind),
    }).pipe(
      map((d) => ({
        data: d.Media.recommendations.nodes
          .filter((n) => n.mediaRecommendation?.idMal)
          .map((n) => ({
            entry: {
              mal_id: n.mediaRecommendation!.idMal!,
              title: n.mediaRecommendation!.title.english || n.mediaRecommendation!.title.romaji,
              images: img(n.mediaRecommendation!.coverImage),
            },
            votes: Math.max(n.rating, 0),
          })),
      })),
    );
  }

  /** AniList reviews have no MAL id; they get negative ids like other AniList-only records. */
  reviews(kind: MediaKind, malId: number, page: number): Observable<Page<Review>> {
    return this.query<{ Media: { reviews: { pageInfo: AlPageInfo; nodes: AlReview[] } } }>(REVIEWS_QUERY, {
      idMal: malId,
      type: type(kind),
      page,
    }).pipe(
      map(({ Media: { reviews } }) => ({
        data: reviews.nodes.map((r) => ({
          mal_id: -r.id,
          url: r.siteUrl,
          date: new Date(r.createdAt * 1000).toISOString(),
          review: cleanMarkdown(r.body) ?? r.summary,
          score: r.score ? Math.round(r.score / 10) : null,
          tags: [],
          is_spoiler: false,
          is_preliminary: false,
          reactions: { overall: Math.max(r.rating, 0) },
          user: { username: r.user.name, url: r.user.siteUrl, images: { jpg: { image_url: r.user.avatar?.medium ?? '' } } },
        })),
        pagination: {
          last_visible_page: reviews.pageInfo.lastPage,
          has_next_page: reviews.pageInfo.hasNextPage,
          current_page: reviews.pageInfo.currentPage,
        },
      })),
    );
  }

  /** Characters are addressed by AniList id here (negative in our URLs). */
  character(anilistId: number): Observable<Single<CharacterFull>> {
    return this.query<{ Character: AlCharacter }>(CHARACTER_QUERY, { id: anilistId }).pipe(
      map(({ Character: c }) => {
        const voices = new Map<number, CharacterFull['voices'][number]>();
        for (const e of c.media.edges) {
          for (const va of e.voiceActors ?? []) {
            voices.set(va.id, { language: 'Japanese', person: { mal_id: -va.id, name: va.name.full, images: img(va.image) } });
          }
        }
        const appearances = c.media.edges.filter((e) => e.node.idMal);
        const entry = (e: AlCharacter['media']['edges'][number]) => ({
          mal_id: e.node.idMal!,
          title: e.node.title.english || e.node.title.romaji,
          images: img(e.node.coverImage),
        });
        return {
          data: {
            mal_id: -c.id,
            name: c.name.full,
            name_kanji: c.name.native,
            nicknames: c.name.alternative.filter(Boolean),
            favorites: c.favourites ?? 0,
            about: cleanMarkdown(c.description),
            images: img(c.image),
            manga: appearances.filter((e) => e.node.type === 'MANGA').map((e) => ({ role: titleCase(e.characterRole), manga: entry(e) })),
            anime: appearances.filter((e) => e.node.type === 'ANIME').map((e) => ({ role: titleCase(e.characterRole), anime: entry(e) })),
            voices: [...voices.values()],
          },
        };
      }),
    );
  }

  private page(kind: MediaKind, vars: Record<string, unknown>): Observable<Page<Media>> {
    return this.query<{ Page: { pageInfo: AlPageInfo; media: AlMedia[] } }>(PAGE_QUERY, { isAdult: false, ...vars }).pipe(
      map(({ Page: p }) => ({
        // Only titles that exist on MyAnimeList can be linked to our MAL-keyed pages.
        data: p.media.filter((m) => m.idMal).map((m) => toMedia(m, kind)),
        pagination: {
          last_visible_page: p.pageInfo.lastPage,
          has_next_page: p.pageInfo.hasNextPage,
          current_page: p.pageInfo.currentPage,
          items: { count: p.media.length, total: p.pageInfo.total, per_page: p.pageInfo.perPage },
        },
      })),
    );
  }

  private query<T>(query: string, variables: Record<string, unknown>): Observable<T> {
    return this.http.post<{ data: T; errors?: { message: string }[] }>(ENDPOINT, { query, variables }).pipe(
      retry({ count: 1, delay: (e) => (e?.status === 429 ? timer(2000) : throwError(() => e)) }),
      map((res) => {
        if (!res.data) throw new Error(res.errors?.[0]?.message ?? 'AniList returned no data');
        return res.data;
      }),
    );
  }
}

// ---------- Mapping ----------

const ENDPOINT = 'https://graphql.anilist.co';

function type(kind: MediaKind): 'MANGA' | 'ANIME' {
  return kind === 'manga' ? 'MANGA' : 'ANIME';
}

function img(image?: { extraLarge?: string | null; large?: string | null; medium?: string | null } | null): JikanImages {
  const large = image?.extraLarge || image?.large || image?.medium || '';
  return { jpg: { image_url: image?.large || large, large_image_url: large } };
}

function toMedia(m: AlMedia, kind: MediaKind): Media {
  const ranked = m.rankings?.find((r) => r.type === 'RATED' && r.allTime);
  const popular = m.rankings?.find((r) => r.type === 'POPULAR' && r.allTime);
  const genres: NamedRef[] = [];
  const themes: NamedRef[] = [];
  for (const name of m.genres ?? []) {
    const g = GENRES.find((x) => (x.anilist ?? x.name) === name && !x.tag && (!x.only || x.only === kind));
    if (g) genres.push({ mal_id: g.ids[kind], type: kind, name: g.name, url: '' });
  }
  const demographics: NamedRef[] = [];
  for (const tag of m.tags ?? []) {
    const g = GENRES.find((x) => x.tag && x.name === tag.name && (!x.only || x.only === kind));
    if (g && tag.rank >= 60) (g.demographic ? demographics : themes).push({ mal_id: g.ids[kind], type: kind, name: g.name, url: '' });
  }
  const dates = { from: isoDate(m.startDate), to: isoDate(m.endDate), string: dateRange(m.startDate, m.endDate) };
  const authors = (m.staff?.edges ?? [])
    .filter((e) => /^(original creator|story( & art)?|art)$/i.test(e.role.trim()))
    .map((e) => ({ mal_id: -e.node.id, type: 'people', name: e.node.name.full, url: '' }));
  const relations = new Map<string, NamedRef[]>();
  for (const e of m.relations?.edges ?? []) {
    // CHARACTER links only mean "shares characters"; skip them like MAL does in its main list.
    if (!e.node.idMal || e.relationType === 'CHARACTER') continue;
    const key = titleCase(e.relationType);
    const ref = { mal_id: e.node.idMal, type: e.node.type === 'MANGA' ? 'manga' : 'anime', name: e.node.title.english || e.node.title.romaji, url: '' };
    relations.set(key, [...(relations.get(key) ?? []), ref]);
  }

  return {
    mal_id: m.idMal!,
    url: `https://myanimelist.net/${kind}/${m.idMal}`,
    images: img(m.coverImage),
    title: m.title.romaji,
    title_english: m.title.english,
    title_japanese: m.title.native,
    type: formatLabel(m.format, m.countryOfOrigin),
    status: statusLabel(m.status, kind),
    score: m.averageScore ? m.averageScore / 10 : m.meanScore ? m.meanScore / 10 : null,
    scored_by: null,
    rank: ranked?.rank ?? null,
    popularity: popular?.rank ?? null,
    members: m.popularity ?? null,
    favorites: m.favourites ?? null,
    synopsis: m.description !== undefined ? stripHtml(m.description) : null,
    background: null,
    genres,
    themes,
    demographics,
    year: m.seasonYear ?? m.startDate?.year ?? null,
    chapters: m.chapters ?? null,
    volumes: m.volumes ?? null,
    episodes: m.episodes ?? null,
    published: kind === 'manga' ? dates : undefined,
    aired: kind === 'anime' ? dates : undefined,
    season: m.season ? m.season.toLowerCase() : null,
    duration: m.duration ? `${m.duration} min per ep` : null,
    source: m.source ? titleCase(m.source) : null,
    studios: (m.studios?.nodes ?? []).map((s) => ({ mal_id: -s.id, type: 'anime', name: s.name, url: '' })),
    authors,
    trailer: { youtube_id: m.trailer?.site === 'youtube' ? m.trailer.id : null, embed_url: null },
    relations: [...relations].map(([relation, entry]) => ({ relation, entry })),
  };
}

function statusLabel(status: string | null, kind: MediaKind): string | null {
  switch (status) {
    case 'RELEASING':
      return kind === 'manga' ? 'Publishing' : 'Currently Airing';
    case 'FINISHED':
      return kind === 'manga' ? 'Finished' : 'Finished Airing';
    case 'NOT_YET_RELEASED':
      return kind === 'manga' ? 'Not yet published' : 'Not yet aired';
    case 'HIATUS':
      return 'On Hiatus';
    case 'CANCELLED':
      return 'Discontinued';
    default:
      return null;
  }
}

function formatLabel(format: string | null, country: string | null): string | null {
  if (format === 'MANGA') return country === 'KR' ? 'Manhwa' : country === 'CN' ? 'Manhua' : 'Manga';
  const labels: Record<string, string> = {
    NOVEL: 'Light Novel',
    ONE_SHOT: 'One-shot',
    TV: 'TV',
    TV_SHORT: 'TV',
    MOVIE: 'Movie',
    OVA: 'OVA',
    ONA: 'ONA',
    SPECIAL: 'Special',
    MUSIC: 'Music',
  };
  return format ? (labels[format] ?? titleCase(format)) : null;
}

type AlDate = { year: number | null; month: number | null; day: number | null } | null | undefined;

function isoDate(d: AlDate): string | null {
  if (!d?.year) return null;
  return `${d.year}-${String(d.month ?? 1).padStart(2, '0')}-${String(d.day ?? 1).padStart(2, '0')}`;
}

function dateRange(from: AlDate, to: AlDate): string | undefined {
  const fmt = (d: AlDate) => {
    if (!d?.year) return '?';
    if (!d.month) return String(d.year);
    return new Date(d.year, d.month - 1, d.day ?? 1).toLocaleDateString('en-US', {
      month: 'short',
      ...(d.day ? { day: 'numeric' } : {}),
      year: 'numeric',
    });
  };
  return from?.year ? `${fmt(from)} to ${fmt(to)}` : undefined;
}

function titleCase(value: string | null | undefined): string {
  if (!value) return '';
  const s = value.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function stripHtml(html: string | null): string | null {
  if (!html) return null;
  const doc = new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, '\n'), 'text/html');
  return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}

/** AniList character bios use markdown and ~!spoiler!~ blocks. */
function cleanMarkdown(text: string | null): string | null {
  if (!text) return null;
  return (stripHtml(text) ?? '')
    .replace(/~![\s\S]*?!~/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- MAL <-> AniList genre table ----------

interface GenreMapping {
  name: string;
  ids: Record<MediaKind, number>;
  /** AniList genre name when it differs from the MAL name. */
  anilist?: string;
  /** AniList models this as a tag rather than a genre. */
  tag?: boolean;
  demographic?: boolean;
  only?: MediaKind;
}

const both = (id: number) => ({ manga: id, anime: id });

const GENRES: GenreMapping[] = [
  { name: 'Action', ids: both(1) },
  { name: 'Adventure', ids: both(2) },
  { name: 'Comedy', ids: both(4) },
  { name: 'Drama', ids: both(8) },
  { name: 'Fantasy', ids: both(10) },
  { name: 'Horror', ids: both(14) },
  { name: 'Mystery', ids: both(7) },
  { name: 'Romance', ids: both(22) },
  { name: 'Sci-Fi', ids: both(24) },
  { name: 'Slice of Life', ids: both(36) },
  { name: 'Sports', ids: both(30) },
  { name: 'Supernatural', ids: both(37) },
  { name: 'Mecha', ids: both(18) },
  { name: 'Music', ids: both(19) },
  { name: 'Psychological', ids: both(40) },
  { name: 'Suspense', anilist: 'Thriller', ids: { manga: 45, anime: 41 } },
  { name: 'Shounen', tag: true, demographic: true, ids: both(27) },
  { name: 'Shoujo', tag: true, demographic: true, ids: both(25) },
  { name: 'Seinen', tag: true, demographic: true, ids: { manga: 41, anime: 42 } },
  { name: 'Josei', tag: true, demographic: true, ids: { manga: 42, anime: 43 } },
  { name: 'Super Power', tag: true, ids: both(31) },
  { name: 'Isekai', tag: true, ids: both(62) },
  { name: 'Military', tag: true, ids: both(38) },
  { name: 'School', tag: true, ids: both(23) },
  { name: 'Martial Arts', tag: true, ids: both(17) },
  { name: 'Historical', tag: true, ids: both(13) },
];

function genreFor(kind: MediaKind, malId: number): GenreMapping | undefined {
  return GENRES.find((g) => g.ids[kind] === malId);
}

const FORMAT_FILTER: Record<string, Record<string, unknown>> = {
  manga: { format: 'MANGA', country: 'JP' },
  manhwa: { format: 'MANGA', country: 'KR' },
  manhua: { format: 'MANGA', country: 'CN' },
  lightnovel: { format: 'NOVEL' },
  novel: { format: 'NOVEL' },
  oneshot: { format: 'ONE_SHOT' },
  tv: { format: 'TV' },
  movie: { format: 'MOVIE' },
  ova: { format: 'OVA' },
  ona: { format: 'ONA' },
  special: { format: 'SPECIAL' },
};

const STATUS_FILTER: Record<string, string> = {
  publishing: 'RELEASING',
  airing: 'RELEASING',
  complete: 'FINISHED',
  hiatus: 'HIATUS',
  discontinued: 'CANCELLED',
  upcoming: 'NOT_YET_RELEASED',
};

const ORDER: Record<string, string> = {
  members: 'POPULARITY_DESC',
  score: 'SCORE_DESC',
  start_date: 'START_DATE_DESC',
  favorites: 'FAVOURITES_DESC',
  title: 'TITLE_ROMAJI',
};

// ---------- GraphQL ----------

const CARD_FIELDS = `
  id idMal type format status countryOfOrigin
  title { romaji english native }
  coverImage { extraLarge large }
  averageScore meanScore popularity favourites
  startDate { year month day } endDate { year month day } seasonYear season
  chapters volumes episodes genres
`;

const PAGE_QUERY = `
query ($page: Int, $perPage: Int, $type: MediaType, $search: String, $genres: [String], $tags: [String],
       $format: MediaFormat, $country: CountryCode, $status: MediaStatus, $scoreGreater: Int,
       $popularityGreater: Int, $season: MediaSeason, $seasonYear: Int, $sort: [MediaSort], $isAdult: Boolean) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total perPage currentPage lastPage hasNextPage }
    media(type: $type, search: $search, genre_in: $genres, tag_in: $tags, format: $format,
          countryOfOrigin: $country, status: $status, averageScore_greater: $scoreGreater,
          popularity_greater: $popularityGreater, season: $season, seasonYear: $seasonYear,
          sort: $sort, isAdult: $isAdult) { ${CARD_FIELDS} description(asHtml: false) }
  }
}`;

const DETAILS_QUERY = `
query ($idMal: Int, $type: MediaType) {
  Media(idMal: $idMal, type: $type) {
    ${CARD_FIELDS}
    description(asHtml: false) duration source
    tags { name rank }
    rankings { rank type allTime }
    studios(isMain: true) { nodes { id name } }
    staff(perPage: 6, sort: RELEVANCE) { edges { role node { id name { full } } } }
    trailer { id site }
    relations { edges { relationType node { idMal type title { romaji english } } } }
  }
}`;

const CHARACTERS_QUERY = `
query ($idMal: Int, $type: MediaType) {
  Media(idMal: $idMal, type: $type) {
    characters(sort: [ROLE, RELEVANCE], perPage: 16) {
      edges { role node { id name { full } image { large } } }
    }
  }
}`;

const RECOMMENDATIONS_QUERY = `
query ($idMal: Int, $type: MediaType) {
  Media(idMal: $idMal, type: $type) {
    recommendations(sort: RATING_DESC, perPage: 18) {
      nodes { rating mediaRecommendation { idMal title { romaji english } coverImage { extraLarge large } } }
    }
  }
}`;

const REVIEWS_QUERY = `
query ($idMal: Int, $type: MediaType, $page: Int) {
  Media(idMal: $idMal, type: $type) {
    reviews(sort: [RATING_DESC], page: $page, perPage: 10) {
      pageInfo { total perPage currentPage lastPage hasNextPage }
      nodes { id summary body(asHtml: false) score rating createdAt siteUrl user { name siteUrl avatar { medium } } }
    }
  }
}`;

const CHARACTER_QUERY = `
query ($id: Int) {
  Character(id: $id) {
    id favourites description
    name { full native alternative }
    image { large }
    media(perPage: 25, sort: POPULARITY_DESC) {
      edges {
        characterRole
        node { idMal type title { romaji english } coverImage { extraLarge large } }
        voiceActors(language: JAPANESE) { id name { full } image { large } }
      }
    }
  }
}`;

// ---------- Response types ----------

interface AlPageInfo {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

interface AlMedia {
  id: number;
  idMal: number | null;
  type: 'MANGA' | 'ANIME';
  format: string | null;
  status: string | null;
  countryOfOrigin: string | null;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { extraLarge: string | null; large: string | null };
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  favourites: number | null;
  startDate: AlDate;
  endDate: AlDate;
  seasonYear: number | null;
  season: string | null;
  chapters: number | null;
  volumes: number | null;
  episodes: number | null;
  genres: string[] | null;
  description?: string | null;
  duration?: number | null;
  source?: string | null;
  tags?: { name: string; rank: number }[];
  rankings?: { rank: number; type: string; allTime: boolean }[];
  studios?: { nodes: { id: number; name: string }[] };
  staff?: { edges: { role: string; node: { id: number; name: { full: string } } }[] };
  trailer?: { id: string; site: string } | null;
  relations?: {
    edges: { relationType: string; node: { idMal: number | null; type: string; title: { romaji: string; english: string | null } } }[];
  };
}

interface AlCharacterEdge {
  role: string;
  node: { id: number; name: { full: string }; image: { large: string | null } };
}

interface AlRecommendation {
  rating: number;
  mediaRecommendation: {
    idMal: number | null;
    title: { romaji: string; english: string | null };
    coverImage: { extraLarge: string | null; large: string | null };
  } | null;
}

interface AlReview {
  id: number;
  summary: string;
  body: string | null;
  score: number | null;
  rating: number;
  createdAt: number;
  siteUrl: string;
  user: { name: string; siteUrl: string; avatar: { medium: string | null } | null };
}

interface AlCharacter {
  id: number;
  favourites: number | null;
  description: string | null;
  name: { full: string; native: string | null; alternative: string[] };
  image: { large: string | null };
  media: {
    edges: {
      characterRole: string;
      node: {
        idMal: number | null;
        type: 'MANGA' | 'ANIME';
        title: { romaji: string; english: string | null };
        coverImage: { extraLarge: string | null; large: string | null };
      };
      voiceActors: { id: number; name: { full: string }; image: { large: string | null } }[] | null;
    }[];
  };
}
