/**
 * Genres shown in the home page mosaic, in mosaic order (left-to-right, top-to-bottom).
 * Ids are MyAnimeList genre ids; art lives in public/genres; `focus` is the object-position
 * that keeps the characters in frame when the art is cropped to its piece.
 */
export const GENRE_TILES = [
  { id: 2, name: 'Adventure', image: 'adventure', focus: '50% 30%' },
  { id: 22, name: 'Romance', image: 'romance', focus: '50% 62%' },
  { id: 10, name: 'Fantasy', image: 'fantasy', focus: '50% 30%' },
  { id: 1, name: 'Action', image: 'action', focus: '50% 22%' },
  { id: 14, name: 'Horror', image: 'horror', focus: '50% 20%' },
  { id: 24, name: 'Sci-Fi', image: 'sci-fi', focus: '62% 38%' },
  { id: 4, name: 'Comedy', image: 'comedy', focus: '60% 30%' },
  { id: 8, name: 'Drama', image: 'drama', focus: '45% 40%' },
  { id: 7, name: 'Mystery', image: 'mystery', focus: '55% 35%' },
  { id: 30, name: 'Sports', image: 'sports', focus: '50% 28%' },
] as const;
