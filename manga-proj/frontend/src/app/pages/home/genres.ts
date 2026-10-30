/**
 * Genres with artwork. The home page mosaic shows FEATURED_GENRES; the rest are reachable from Browse.
 * Ids are MyAnimeList genre/demographic ids (Jikan's `genres` filter accepts both); art lives in
 * public/genres; `focus` is the object-position that keeps the characters in frame.
 */
export const GENRE_TILES = [
  { id: 2, name: 'Adventure', image: 'adventure', focus: '50% 30%' },
  { id: 22, name: 'Romance', image: 'romance', focus: '50% 62%' },
  { id: 10, name: 'Fantasy', image: 'fantasy', focus: '50% 30%' },
  { id: 1, name: 'Action', image: 'action', focus: '50% 22%' },
  { id: 14, name: 'Horror', image: 'horror', focus: '50% 20%' },
  { id: 27, name: 'Shounen', image: 'shounen', focus: '50% 22%' },
  { id: 24, name: 'Sci-Fi', image: 'sci-fi', focus: '62% 38%' },
  { id: 4, name: 'Comedy', image: 'comedy', focus: '60% 30%' },
  { id: 7, name: 'Mystery', image: 'mystery', focus: '55% 35%' },
  { id: 41, name: 'Seinen', image: 'seinen', focus: '50% 30%' },
  { id: 18, name: 'Mecha', image: 'mecha', focus: '50% 25%' },
  { id: 37, name: 'Supernatural', image: 'supernatural', focus: '55% 6%' },
  { id: 8, name: 'Drama', image: 'drama', focus: '45% 40%' },
  { id: 31, name: 'Super Power', image: 'super-power', focus: '55% 30%' },
  { id: 30, name: 'Sports', image: 'sports', focus: '50% 28%' },
] as const;

/** Shown in the home mosaic, in piece order: the tall feature piece first, then column by column. */
export const FEATURED_GENRES = [1, 10, 37, 14, 30, 7, 24].map((id) => GENRE_TILES.find((g) => g.id === id)!);
