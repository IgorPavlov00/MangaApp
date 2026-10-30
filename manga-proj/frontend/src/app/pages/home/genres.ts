/**
 * Comic-panel genre tiles on the home page. Ids are MyAnimeList genre/demographic ids
 * (Jikan's `genres` filter accepts both); art lives in public/genres.
 */
export const GENRE_TILES = [
  { id: 1, name: 'Action', kanji: '闘', image: 'action' },
  { id: 10, name: 'Fantasy', kanji: '幻', image: 'fantasy' },
  { id: 27, name: 'Shounen', kanji: '少', image: 'shounen' },
  { id: 14, name: 'Horror', kanji: '怖', image: 'horror' },
  { id: 22, name: 'Romance', kanji: '恋', image: 'romance' },
  { id: 30, name: 'Sports', kanji: '走', image: 'sports' },
  { id: 41, name: 'Seinen', kanji: '青', image: 'seinen' },
  { id: 7, name: 'Mystery', kanji: '謎', image: 'mystery' },
  { id: 18, name: 'Mecha', kanji: '機', image: 'mecha' },
  { id: 24, name: 'Sci-Fi', kanji: '宙', image: 'sci-fi' },
  { id: 37, name: 'Super00ADnatural', kanji: '霊', image: 'supernatural' },
  { id: 31, name: 'Super Power', kanji: '力', image: 'super-power' },
] as const;
