/** Filter values accepted by Jikan's /manga and /anime search endpoints. */

export const TYPE_OPTIONS = {
  manga: [
    { value: 'manga', label: 'Manga' },
    { value: 'manhwa', label: 'Manhwa' },
    { value: 'manhua', label: 'Manhua' },
    { value: 'lightnovel', label: 'Light novel' },
    { value: 'novel', label: 'Novel' },
    { value: 'oneshot', label: 'One-shot' },
  ],
  anime: [
    { value: 'tv', label: 'TV' },
    { value: 'movie', label: 'Movie' },
    { value: 'ova', label: 'OVA' },
    { value: 'ona', label: 'ONA' },
    { value: 'special', label: 'Special' },
  ],
};

export const STATUS_OPTIONS = {
  manga: [
    { value: 'publishing', label: 'Publishing' },
    { value: 'complete', label: 'Finished' },
    { value: 'hiatus', label: 'On hiatus' },
    { value: 'discontinued', label: 'Discontinued' },
    { value: 'upcoming', label: 'Upcoming' },
  ],
  anime: [
    { value: 'airing', label: 'Airing' },
    { value: 'complete', label: 'Finished' },
    { value: 'upcoming', label: 'Upcoming' },
  ],
};

export const ORDER_OPTIONS = [
  { value: 'members', sort: 'desc', label: 'Most popular' },
  { value: 'score', sort: 'desc', label: 'Highest score' },
  { value: 'start_date', sort: 'desc', label: 'Newest' },
  { value: 'favorites', sort: 'desc', label: 'Most favourited' },
  { value: 'title', sort: 'asc', label: 'Title A–Z' },
] as const;

export const SCORE_OPTIONS = [
  { value: '9', label: '9+' },
  { value: '8', label: '8+' },
  { value: '7', label: '7+' },
  { value: '6', label: '6+' },
];
