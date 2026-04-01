import type { Video } from '../data/videos-legacy';

export type GameTag =
  | 'halo-wars-2'
  | 'halo-wars-1'
  | 'aoe4'
  | 'aoe2'
  | 'aom'
  | 'halo-fps'
  | 'gears'
  | 'goblin-commander'
  | 'command-and-conquer'
  | 'company-of-heroes'
  | 'tempest-rising'
  | 'spellforce'
  | 'ashes'
  | 'other';

export type SeriesTag =
  | 'mythbusters'
  | 'super-turtle'
  | 'walkthrough'
  | 'guide'
  | 'review'
  | 'general';

export type FormatTag = 'short' | 'long';
export type SortOption = 'newest' | 'oldest' | 'shortest' | 'longest' | 'title' | 'relevance';

export interface TaggedVideo extends Video {
  game: GameTag;
  series: SeriesTag;
  format: FormatTag;
  year: number;
}

export interface VideoComposerOption<T extends string | number> {
  value: T;
  label: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  shortLabel?: string;
}

export interface VideoComposerCountOption<T extends string | number> extends VideoComposerOption<T> {
  count: number;
}

export interface VideoSearchRecord extends TaggedVideo {
  youtubeUrl: string;
  thumbnailUrl: string;
  gameLabel: string;
  seriesLabel: string;
  formatLabel: string;
  publishedLabel: string;
  durationLabel: string;
  searchableText: string;
}

export interface VideoDatabaseState {
  query: string;
  games: GameTag[];
  series: SeriesTag[];
  formats: FormatTag[];
  years: number[];
  sort: SortOption;
  page: number;
}

export interface VideoDatabasePagination<T> {
  items: T[];
  page: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export interface VideoLibraryStats {
  totalVideos: number;
  gamesCovered: number;
  yearsCovered: number;
  shortsCount: number;
  longFormCount: number;
  latestPublishedLabel: string;
}

export interface VideoFilterChip {
  type: 'query' | 'game' | 'series' | 'format' | 'year';
  value: string;
  label: string;
}

export const PAGE_SIZE = 24;
export const DEFAULT_SORT: SortOption = 'newest';
export const DEFAULT_FORMATS: FormatTag[] = ['long'];

export const GAME_LABELS: Record<GameTag, string> = {
  'halo-wars-2': 'Halo Wars 2',
  'halo-wars-1': 'Halo Wars',
  aoe4: 'Age of Empires IV',
  aoe2: 'Age of Empires II',
  aom: 'Age of Mythology Retold',
  'halo-fps': 'Halo FPS',
  gears: 'Gears of War',
  'goblin-commander': 'Goblin Commander',
  'command-and-conquer': 'Command & Conquer',
  'company-of-heroes': 'Company of Heroes',
  'tempest-rising': 'Tempest Rising',
  spellforce: 'Spellforce',
  ashes: 'Ashes of the Singularity',
  other: 'Other',
};

export const SERIES_LABELS: Record<SeriesTag, string> = {
  mythbusters: 'Mythbusters',
  'super-turtle': 'Super Turtle',
  walkthrough: 'Walkthrough',
  guide: 'Guides',
  review: 'Reviews',
  general: 'General',
};

export const FORMAT_LABELS: Record<FormatTag, string> = {
  short: 'Shorts',
  long: 'Long Form',
};

export const GAME_OPTIONS: VideoComposerOption<GameTag>[] = [
  {
    value: 'halo-wars-2',
    label: 'Halo Wars 2',
    shortLabel: 'HW2',
    title: 'Halo Wars 2 videos',
    description: 'Mythbusters, ranked matches, leader breakdowns, and more.',
    image: '/img/game-icons/halo-wars-2.png',
  },
  {
    value: 'halo-wars-1',
    label: 'Halo Wars',
    shortLabel: 'HW1',
    title: 'Halo Wars videos',
    description: 'Classic Halo Wars gameplay, tier lists, and retrospectives.',
    image: '/img/game-icons/halo-wars-1.png',
  },
  {
    value: 'aoe4',
    label: 'Age of Empires IV',
    shortLabel: 'AoE IV',
    title: 'Age of Empires IV videos',
    description: 'Build orders, matches, civ coverage, and strategy guides.',
    image: '/img/game-icons/Age-of-Empires-IV.png',
  },
  {
    value: 'aoe2',
    label: 'Age of Empires II',
    shortLabel: 'AoE II',
    title: 'Age of Empires II videos',
    description: 'Legacy RTS content, ranked play, and challenge videos.',
    image: '/img/game-icons/Age-of-Empires-II.png',
  },
  {
    value: 'aom',
    label: 'Age of Mythology',
    shortLabel: 'AoM',
    title: 'Age of Mythology videos',
    description: 'Retold coverage, gods, matchups, and showcase battles.',
    image: '/img/game-icons/Retold.png',
  },
  {
    value: 'halo-fps',
    label: 'Halo FPS',
    shortLabel: 'Halo FPS',
    title: 'Halo FPS videos',
    description: 'Campaign moments, multiplayer clips, and Halo deep dives.',
    image: '/img/game-icons/H1-White.png',
  },
  {
    value: 'gears',
    label: 'Gears of War',
    shortLabel: 'Gears',
    title: 'Gears of War videos',
    description: 'Gears gameplay, commentary, and classic uploads.',
    image: '/img/game-icons/Gears-Cog.png',
  },
  {
    value: 'goblin-commander',
    label: 'Goblin Commander',
    shortLabel: 'Goblin Cmdr',
    title: 'Goblin Commander videos',
    description: 'Retro strategy game coverage from the archive.',
    icon: 'fa-chess-king',
  },
  {
    value: 'command-and-conquer',
    label: 'Command & Conquer',
    shortLabel: 'C&C',
    title: 'Command & Conquer videos',
    description: 'Classic RTS showcases and related strategy content.',
    image: '/img/game-icons/command-and-conquer.png',
  },
  {
    value: 'company-of-heroes',
    label: 'Company of Heroes',
    shortLabel: 'CoH',
    title: 'Company of Heroes videos',
    description: 'Company of Heroes matches and impressions.',
    image: '/img/game-icons/Company-of-Heroes.png',
  },
  {
    value: 'tempest-rising',
    label: 'Tempest Rising',
    shortLabel: 'Tempest',
    title: 'Tempest Rising videos',
    description: 'Modern RTS previews and match coverage.',
    icon: 'fa-wind',
  },
  {
    value: 'spellforce',
    label: 'Spellforce',
    shortLabel: 'Spellforce',
    title: 'Spellforce videos',
    description: 'Spellforce and Conquest of Eo coverage.',
    image: '/img/game-icons/spellforce.png',
  },
  {
    value: 'ashes',
    label: 'Ashes of the Singularity',
    shortLabel: 'Ashes',
    title: 'Ashes of the Singularity videos',
    description: 'Ashes of the Singularity gameplay and impressions.',
    icon: 'fa-meteor',
  },
  {
    value: 'other',
    label: 'Other',
    shortLabel: 'Other',
    title: 'Other videos',
    description: 'Everything else in the Team Respawn archive.',
    icon: 'fa-gamepad',
  },
];

export const SERIES_OPTIONS: VideoComposerOption<SeriesTag>[] = [
  {
    value: 'mythbusters',
    label: 'Mythbusters',
    title: 'Mythbusters series',
    description: 'Experimental tests, unit comparisons, and what-if scenarios.',
    icon: 'fa-flask',
  },
  {
    value: 'super-turtle',
    label: 'Super Turtle',
    title: 'Super Turtle series',
    description: 'Defensive holdouts and stubborn late-game builds.',
    icon: 'fa-shield-halved',
  },
  {
    value: 'walkthrough',
    label: 'Walkthrough',
    title: 'Walkthrough videos',
    description: 'Campaign runs, full missions, and complete playthroughs.',
    icon: 'fa-film',
  },
  {
    value: 'guide',
    label: 'Guides',
    title: 'Guide videos',
    description: 'Tips, strategy explainers, build logic, and how-to content.',
    icon: 'fa-lightbulb',
  },
  {
    value: 'review',
    label: 'Reviews',
    title: 'Review videos',
    description: 'Reviews, impressions, and ranking-style videos.',
    icon: 'fa-star',
  },
];

export const FORMAT_OPTIONS: VideoComposerOption<FormatTag>[] = [
  {
    value: 'short',
    label: 'Shorts',
    title: 'Short-form videos',
    description: 'Under two minutes.',
    icon: 'fa-bolt',
  },
  {
    value: 'long',
    label: 'Long Form',
    title: 'Long-form videos',
    description: 'Two minutes or longer.',
    icon: 'fa-clapperboard',
  },
];

export const SORT_OPTIONS: { value: SortOption; label: string; title: string }[] = [
  { value: 'newest', label: 'Newest', title: 'Newest first' },
  { value: 'oldest', label: 'Oldest', title: 'Oldest first' },
  { value: 'longest', label: 'Longest', title: 'Longest first' },
  { value: 'shortest', label: 'Shortest', title: 'Shortest first' },
  { value: 'title', label: 'A-Z', title: 'Title order' },
  { value: 'relevance', label: 'Relevance', title: 'Best title and metadata match' },
];

const VALID_GAME_TAGS = new Set<GameTag>(GAME_OPTIONS.map((option) => option.value));
const VALID_SERIES_TAGS = new Set<SeriesTag>(SERIES_OPTIONS.map((option) => option.value));
const VALID_FORMAT_TAGS = new Set<FormatTag>(FORMAT_OPTIONS.map((option) => option.value));
const VALID_SORTS = new Set<SortOption>(SORT_OPTIONS.map((option) => option.value));
const AOE4_TITLE_OVERRIDES = new Set(
  [
    'They were so ANGRY it was hilarious! Age 4 2v2v2v2 Nomad',
    "I thought my WALLS would save us! They didn't.",
    'I played with the craziest teammates in Age of Empries 4 nomad!',
    '2v2v2 Megarandom Nomad in Age of Empires is AMAZING!',
  ].map((title) => normalizeSearchText(title)),
);
const HALO_FPS_TITLE_OVERRIDES = new Set(
  [
    'Should You Buy Halo: The Master Chief Collection in 2026?',
    'Should You Buy Halo: The Master Chief Collection in 2025?',
    'Should You Buy Halo: The Master Chief Collection in 2024?',
    'Big Team Fiesta is so much FUN! #haloinfinite',
    'Halo 1 but Cursed is RIDICULOUS!',
    'Should You Buy Halo: The Master Chief Collection in 2023?',
    'Anniversary Slayer in MCC is HILARIOUS!',
    'Should You Buy Halo: The Master Chief Collection in 2022?',
  ].map((title) => normalizeSearchText(title)),
);
const HALO_WARS_2_TITLE_OVERRIDES = new Set(
  [
    'How are the touch controls for Halo Wars? Halo Wars + Xbox Cloud Gaming',
    "I hate my teammates in Halo Wars and here's why",
    'The Glassing Beam in Halo Wars is CRAZY!!',
    'We considered quitting Halo Wars after this match',
    "I played Halo Wars with a Financial Advisor. Here's how it went",
    'My Scarab took down their CRINGE AIR! Halo Wars Super Turtle',
    'We won this Halo Wars game with a SINGLE leader power!',
    'The Maelstrom and EMP MAC is SO GOOD! Halo Wars Super Turtle',
    'The Future of Halo Wars Tournaments!',
    'Yap Yap and Atriox Stop Everything! Halo Wars Super Turtle',
    'A Tale of Two Sgt Johnsons - Halo Wars',
    'UNBELIEVABLE Stand on Sentry! Halo Wars Super Turtle',
    'The Legend Behind Halo Wars Machinimas and Epic Battles - Interviewing Really Good Gaming',
    'Turtling with Super Units! | Halo Wars Super Turtle',
    'Reverse Turtle on Vault! | Halo Wars Super Turtle',
    'Mega Turrets Rock The Map | Halo Wars Super Turtle',
    'Turtling for over 4 Hours as Isabel! | Halo Wars Super Turtle',
    'Awesome Defense in 2v3 Turtle! | Halo Wars Super Turtle',
    'The Invincible Hunter Captain | Halo Wars Super Turtle',
    'Behold - The 3 Hour Turtle | Halo Wars Super Turtle',
    'Last Stand on Sentry | Halo Wars Super Turtle',
    'Trolling As Yap Yap in Bunkers! | Halo Wars Super Turtle',
    'Sentry is Broken | Halo Wars Super Turtle',
    'Champion Falls on Fort Jordan | Halo Wars Super Turtle',
    'Old Friends, New Adventures | Halo Wars Super Turtle',
    'Turtling Champions on Sentry | Halo Wars Super Turtle',
    "Cutter's Close Air Support is CRAZY",
    'I kinda forgot that the Hunter Captain was AWESOME',
    "Kinsano's FLAMEHOGS are awesome, but you already knew that",
    'They tried EVERYTHING to break our Super Turtle!',
    'We Super Turtled them and of course they went Cringe Air...',
    'We Dropped BUNKERS in Front of their Base!',
    'Why do we keep doing this to ourselves...',
    'Tell me you hate mass air without telling me you hate mass air',
    "These guys didn't go ANTI MANTI and you know what happens next",
    'why did you pick Pavium?',
    'we super turtled with the BEST siege base ever?!',
    'Wait... a Pavium MEGA TURRET base fails?!',
  ].map((title) => normalizeSearchText(title)),
);

const publishedDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** Returns a fresh default state with no filters, newest sort, and page 1. */
export function getDefaultState(): VideoDatabaseState {
  return {
    query: '',
    games: [],
    series: [],
    formats: [...DEFAULT_FORMATS],
    years: [],
    sort: DEFAULT_SORT,
    page: 1,
  };
}

export function getFormat(durationMs: number | null): FormatTag {
  if (durationMs !== null && durationMs < 120_000) return 'short';
  return 'long';
}

export function getGame(title: string): GameTag {
  const text = normalizeSearchText(title);

  if (AOE4_TITLE_OVERRIDES.has(text)) return 'aoe4';
  if (HALO_FPS_TITLE_OVERRIDES.has(text)) return 'halo-fps';
  if (HALO_WARS_2_TITLE_OVERRIDES.has(text)) return 'halo-wars-2';
  if (/\bshipmaster\b/.test(text)) return 'halo-wars-2';
  if (/\bhalo wars 2\b|\bhw2\b/.test(text)) return 'halo-wars-2';
  if (/\bhalo wars\b|\bhw1\b/.test(text)) return 'halo-wars-1';
  if (/\bage of empires iv\b|\bage of empires 4\b|\baoe ?4\b/.test(text)) return 'aoe4';
  if (/\bage of empires ii\b|\bage of empires 2\b|\baoe ?2\b/.test(text)) return 'aoe2';
  if (/\bage of mythology\b|\baom\b|\bretold\b/.test(text)) return 'aom';

  if (
    /\bhalo infinite\b|\bhalo 3\b|\bhalo 4\b|\bhalo 2\b|\bhalo reach\b|\bhalo ce\b|\bcombat evolved\b|\bhalo mcc\b|\bhalo odst\b|\bhalo campaign\b/.test(
      text,
    )
  ) {
    return 'halo-fps';
  }

  if (/\bspace gears\b/.test(text)) return 'other';
  if (/\bgears\b|\bgears of war\b/.test(text)) return 'gears';
  if (/\bgoblin commander\b/.test(text)) return 'goblin-commander';
  if (/\bcommand and conquer\b|\bred alert\b|\bc c\b|\bkane s wrath\b/.test(text)) return 'command-and-conquer';
  if (/\bcompany of heroes\b|\bcoh\b/.test(text)) return 'company-of-heroes';
  if (/\btempest rising\b/.test(text)) return 'tempest-rising';
  if (/\bspellforce\b|\bconquest of eo\b/.test(text)) return 'spellforce';
  if (/\bashes of the singularity\b/.test(text)) return 'ashes';

  return 'other';
}

export function getSeries(title: string): SeriesTag {
  const text = normalizeSearchText(title);

  if (/\bmythbuster/.test(text)) return 'mythbusters';
  if (/\bsuper turtle\b/.test(text)) return 'super-turtle';
  if (/\bwalkthrough\b|\bfull campaign\b|\bfull legendary\b|\bplaythrough\b/.test(text)) return 'walkthrough';
  if (/\breview\b|\bfirst impression\b|\branking every\b|\btier list\b/.test(text)) return 'review';
  if (/\bhow to\b|\bguide\b|\btips?\b|\bstrategy\b|\bbuild order\b/.test(text)) return 'guide';

  return 'general';
}

/**
 * Derives game, series, format, and year tags from a raw Video entry.
 * Game and series are inferred from the title via regex when not explicitly set.
 */
export function tagVideo(video: Video): TaggedVideo {
  const format = getFormat(video.durationMs);
  const game = video.game ?? getGame(video.title);
  const series = video.series ?? getSeries(video.title);
  const year = video.publishedAt ? Number.parseInt(video.publishedAt.slice(0, 4), 10) || 0 : 0;

  return { ...video, game, series, format, year };
}

/**
 * Builds a fully-enriched VideoSearchRecord from a raw Video: tags it,
 * computes display labels, formats the duration and publish date, and
 * concatenates a normalised searchableText string for fast client-side matching.
 */
export function buildVideoSearchRecord(video: Video): VideoSearchRecord {
  const taggedVideo = tagVideo(video);
  const gameLabel = GAME_LABELS[taggedVideo.game];
  const seriesLabel = SERIES_LABELS[taggedVideo.series];
  const formatLabel = FORMAT_LABELS[taggedVideo.format];

  return {
    ...taggedVideo,
    youtubeUrl: getVideoWatchUrl(taggedVideo.videoId),
    thumbnailUrl: getVideoThumbnailUrl(taggedVideo.videoId),
    gameLabel,
    seriesLabel,
    formatLabel,
    publishedLabel: formatPublishedDate(taggedVideo.publishedAt),
    durationLabel: formatDuration(taggedVideo.durationMs),
    searchableText: normalizeSearchText(
      [
        taggedVideo.title,
        gameLabel,
        seriesLabel,
        formatLabel,
        String(taggedVideo.year || ''),
      ].join(' '),
    ),
  };
}

export function buildVideoSearchRecords(videos: Video[]): VideoSearchRecord[] {
  return videos
    .filter((video) => video.privacy === 'Public')
    .map(buildVideoSearchRecord)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function getAvailableYears(videos: TaggedVideo[]): number[] {
  return [...new Set(videos.map((video) => video.year))]
    .filter((year) => Number.isInteger(year) && year > 0)
    .sort((left, right) => right - left);
}

export function getFacetCounts<T extends string | number>(
  videos: TaggedVideo[],
  getValue: (video: TaggedVideo) => T,
): Map<T, number> {
  const counts = new Map<T, number>();

  for (const video of videos) {
    const value = getValue(video);
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return counts;
}

export function getGameOptions(videos: TaggedVideo[]): VideoComposerCountOption<GameTag>[] {
  const counts = getFacetCounts(videos, (video) => video.game);
  return GAME_OPTIONS.filter((option) => counts.has(option.value)).map((option) => ({
    ...option,
    count: counts.get(option.value) || 0,
  }));
}

export function getSeriesOptions(videos: TaggedVideo[]): VideoComposerCountOption<SeriesTag>[] {
  const counts = getFacetCounts(videos, (video) => video.series);
  return SERIES_OPTIONS.filter((option) => counts.has(option.value)).map((option) => ({
    ...option,
    count: counts.get(option.value) || 0,
  }));
}

export function getFormatOptions(videos: TaggedVideo[]): VideoComposerCountOption<FormatTag>[] {
  const counts = getFacetCounts(videos, (video) => video.format);
  return FORMAT_OPTIONS.filter((option) => counts.has(option.value)).map((option) => ({
    ...option,
    count: counts.get(option.value) || 0,
  }));
}

export function getYearOptions(videos: TaggedVideo[]): VideoComposerCountOption<number>[] {
  const counts = getFacetCounts(videos, (video) => video.year);

  return getAvailableYears(videos).map((year) => ({
    value: year,
    label: String(year),
    title: `Videos from ${year}`,
    description: `Team Respawn uploads published in ${year}.`,
    count: counts.get(year) || 0,
  }));
}

export function getVideoLibraryStats(videos: TaggedVideo[]): VideoLibraryStats {
  const availableYears = getAvailableYears(videos);
  const shortsCount = videos.filter((video) => video.format === 'short').length;
  const longFormCount = videos.filter((video) => video.format === 'long').length;

  return {
    totalVideos: videos.length,
    gamesCovered: new Set(videos.map((video) => video.game).filter((game) => game !== 'other')).size,
    yearsCovered: availableYears.length,
    shortsCount,
    longFormCount,
    latestPublishedLabel: videos[0]?.publishedAt ? formatPublishedDate(videos[0].publishedAt) : 'Archive',
  };
}

/**
 * Parses a VideoDatabaseState from URL search params.
 * Handles legacy `dur` / `shorts=1` params for backwards compatibility.
 * All values are validated against the available video set; unknown tags are silently dropped.
 */
export function parseStateFromSearchParams(
  searchParams: URLSearchParams,
  videos: TaggedVideo[],
): VideoDatabaseState {
  const availableYears = new Set<number>(getAvailableYears(videos));
  const defaultState = getDefaultState();

  const query = (searchParams.get('q') || '').trim();
  const games = parseCsvValues<GameTag>(searchParams.get('games')).filter((value) => VALID_GAME_TAGS.has(value));
  const series = parseCsvValues<SeriesTag>(searchParams.get('series')).filter((value) => VALID_SERIES_TAGS.has(value));
  const years = parseCsvValues(searchParams.get('years'))
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && availableYears.has(value));

  let formats = parseCsvValues(searchParams.get('formats'))
    .map(normalizeLegacyFormatTag)
    .filter((value): value is FormatTag => Boolean(value) && VALID_FORMAT_TAGS.has(value));

  if (formats.length === 0 && searchParams.has('dur')) {
    formats = parseCsvValues(searchParams.get('dur'))
      .map(normalizeLegacyFormatTag)
      .filter((value): value is FormatTag => Boolean(value) && VALID_FORMAT_TAGS.has(value));
  }

  if (searchParams.get('shorts') === '1' && !formats.includes('short')) {
    formats.push('short');
  }

  if (!searchParams.has('formats') && !searchParams.has('dur')) {
    formats = [...defaultState.formats];
  }

  if (formats.length === 0) {
    formats = [...defaultState.formats];
  }

  const sortParam = (searchParams.get('sort') || '').toLowerCase() as SortOption;
  const sort = VALID_SORTS.has(sortParam) ? sortParam : query ? 'relevance' : defaultState.sort;

  const pageParam = Number.parseInt(searchParams.get('page') || '', 10);
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  return {
    query,
    games: uniqueValues(games, (left, right) => left.localeCompare(right)),
    series: uniqueValues(series, (left, right) => left.localeCompare(right)),
    formats: uniqueValues(formats, formatSortComparer),
    years: uniqueValues(years, (left, right) => right - left),
    sort,
    page,
  };
}

/**
 * Applies the full filter + sort pipeline from a VideoDatabaseState.
 * Filtering is applied in order: game → series → format → year → query.
 * An empty formats array yields zero results (all formats must be explicitly selected).
 */
export function filterAndSortVideos(videos: VideoSearchRecord[], state: VideoDatabaseState): VideoSearchRecord[] {
  const normalizedQuery = normalizeSearchText(state.query);
  let filteredVideos = videos.slice();

  if (state.games.length > 0) {
    const selectedGames = new Set(state.games);
    filteredVideos = filteredVideos.filter((video) => selectedGames.has(video.game));
  }

  if (state.series.length > 0) {
    const selectedSeries = new Set(state.series);
    filteredVideos = filteredVideos.filter((video) => selectedSeries.has(video.series));
  }

  if (state.formats.length > 0) {
    const selectedFormats = new Set(state.formats);
    filteredVideos = filteredVideos.filter((video) => selectedFormats.has(video.format));
  } else {
    filteredVideos = [];
  }

  if (state.years.length > 0) {
    const selectedYears = new Set(state.years);
    filteredVideos = filteredVideos.filter((video) => selectedYears.has(video.year));
  }

  if (normalizedQuery) {
    filteredVideos = filteredVideos.filter((video) => matchesQuery(video, normalizedQuery));
  }

  const sortedVideos = filteredVideos.sort((left, right) => compareVideos(left, right, state.sort, normalizedQuery));
  return sortedVideos;
}

export function paginateVideos<T>(videos: T[], page: number, pageSize = PAGE_SIZE): VideoDatabasePagination<T> {
  const totalPages = videos.length === 0 ? 0 : Math.ceil(videos.length / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(page, 1), totalPages);
  const startIndex = totalPages === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = totalPages === 0 ? 0 : Math.min(startIndex + pageSize, videos.length);

  return {
    items: videos.slice(startIndex, endIndex),
    page: safePage,
    totalPages,
    startIndex,
    endIndex,
  };
}

export function getActiveFilterChips(state: VideoDatabaseState): VideoFilterChip[] {
  const chips: VideoFilterChip[] = [];
  const trimmedQuery = state.query.trim();

  if (trimmedQuery) {
    chips.push({
      type: 'query',
      value: trimmedQuery,
      label: `Search: ${trimmedQuery}`,
    });
  }

  for (const game of state.games) {
    chips.push({
      type: 'game',
      value: game,
      label: GAME_LABELS[game],
    });
  }

  for (const series of state.series) {
    chips.push({
      type: 'series',
      value: series,
      label: SERIES_LABELS[series],
    });
  }

  if (!isSameFormatSelection(state.formats, DEFAULT_FORMATS)) {
    for (const format of state.formats) {
      chips.push({
        type: 'format',
        value: format,
        label: FORMAT_LABELS[format],
      });
    }
  }

  for (const year of state.years) {
    chips.push({
      type: 'year',
      value: String(year),
      label: String(year),
    });
  }

  return chips;
}

export function isDefaultFormatSelection(formats: FormatTag[]): boolean {
  return isSameFormatSelection(formats, DEFAULT_FORMATS);
}

export function getSortStatusLabel(sort: SortOption): string {
  if (sort === 'title') return 'Sorted A-Z';
  if (sort === 'relevance') return 'Sorted by relevance';
  return `Sorted by ${sort}`;
}

export function getPaginationWindow(totalPages: number, currentPage: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);

  if (currentPage - 1 > 1) pages.add(currentPage - 1);
  if (currentPage + 1 < totalPages) pages.add(currentPage + 1);
  if (currentPage <= 3) pages.add(2);
  if (currentPage >= totalPages - 2) pages.add(totalPages - 1);

  return [...pages].sort((left, right) => left - right);
}

export function getPageHref(state: VideoDatabaseState, page: number): string {
  const searchParams = serializeStateToSearchParams({ ...state, page });
  const query = searchParams.toString();
  return query ? `/videos/?${query}` : '/videos/';
}

export function serializeStateToSearchParams(state: VideoDatabaseState): URLSearchParams {
  const searchParams = new URLSearchParams();
  const trimmedQuery = state.query.trim();

  if (trimmedQuery) searchParams.set('q', trimmedQuery);
  if (state.games.length > 0) searchParams.set('games', [...state.games].sort().join(','));
  if (state.series.length > 0) searchParams.set('series', [...state.series].sort().join(','));
  if (!isSameFormatSelection(state.formats, DEFAULT_FORMATS)) {
    searchParams.set('formats', [...state.formats].sort(formatSortComparer).join(','));
  }
  if (state.years.length > 0) searchParams.set('years', [...state.years].sort((left, right) => right - left).join(','));
  if (state.sort !== DEFAULT_SORT) searchParams.set('sort', state.sort);
  if (state.page > 1) searchParams.set('page', String(state.page));

  return searchParams;
}

/**
 * Scores a video title against a search query.
 * Weights: exact match +200, starts-with +90, substring +40, per-word match +20.
 * Both inputs should be pre-normalised via normalizeSearchText.
 */
export function scoreTitle(title: string, query: string): number {
  const normalizedTitle = normalizeSearchText(title);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return 0;

  let score = 0;
  if (normalizedTitle === normalizedQuery) score += 200;
  if (normalizedTitle.startsWith(normalizedQuery)) score += 90;
  if (normalizedTitle.includes(normalizedQuery)) score += 40;

  const queryWords = normalizedQuery.split(' ').filter(Boolean);
  for (const word of queryWords) {
    if (normalizedTitle.includes(word)) score += 20;
  }

  return score;
}

/**
 * Scores a full VideoSearchRecord against a query.
 * Combines title scoring with searchableText and label bonuses:
 * searchableText substring +60, exact game/series label match +35 each,
 * per-word searchableText match +14.
 */
export function scoreVideo(video: VideoSearchRecord, query: string): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  let score = scoreTitle(video.title, normalizedQuery);

  if (video.searchableText.includes(normalizedQuery)) score += 60;
  if (normalizeSearchText(video.gameLabel) === normalizedQuery) score += 35;
  if (normalizeSearchText(video.seriesLabel) === normalizedQuery) score += 35;

  const queryWords = normalizedQuery.split(' ').filter(Boolean);
  for (const word of queryWords) {
    if (word && video.searchableText.includes(word)) score += 14;
  }

  return score;
}

export function formatDuration(durationMs: number | null): string {
  if (durationMs === null || Number.isNaN(durationMs)) return '';

  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatPublishedDate(isoDate: string): string {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  return publishedDateFormatter.format(date);
}

export function getVideoWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getVideoThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Lowercases the string, expands `&` to `and`, and collapses all
 * non-alphanumeric runs to single spaces. Used consistently for both
 * indexing and query normalisation so comparisons are always apples-to-apples.
 */
export function normalizeSearchText(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseCsvValues<T extends string = string>(value: string | null): T[] {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as T[];
}

function uniqueValues<T>(values: T[], compare: (left: T, right: T) => number): T[] {
  return [...new Set(values)].sort(compare);
}

function formatSortComparer(left: FormatTag, right: FormatTag): number {
  const order: Record<FormatTag, number> = { short: 0, long: 1 };
  return order[left] - order[right];
}

function normalizeLegacyFormatTag(value: string): FormatTag | null {
  if (value === 'medium') return 'long';
  if (value === 'short' || value === 'long') return value;
  return null;
}

function isSameFormatSelection(left: FormatTag[], right: FormatTag[]): boolean {
  if (left.length !== right.length) return false;

  const normalizedLeft = [...left].sort(formatSortComparer);
  const normalizedRight = [...right].sort(formatSortComparer);
  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function matchesQuery(video: VideoSearchRecord, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  if (video.searchableText.includes(normalizedQuery)) return true;

  const queryWords = normalizedQuery.split(' ').filter(Boolean);
  if (queryWords.length === 0) return true;

  return queryWords.every((word) => video.searchableText.includes(word));
}

function hasKnownDuration(video: VideoSearchRecord): boolean {
  return typeof video.durationMs === 'number' && Number.isFinite(video.durationMs);
}

function compareVideos(
  left: VideoSearchRecord,
  right: VideoSearchRecord,
  sort: SortOption,
  query: string,
): number {
  if (sort === 'oldest') return left.publishedAt.localeCompare(right.publishedAt);
  if (sort === 'title') return left.title.localeCompare(right.title);
  if (sort === 'longest') return compareDurationDesc(left, right);
  if (sort === 'shortest') return compareDurationAsc(left, right);
  if (sort === 'relevance') {
    const scoreDifference = scoreVideo(right, query) - scoreVideo(left, query);
    if (scoreDifference !== 0) return scoreDifference;
  }

  return right.publishedAt.localeCompare(left.publishedAt);
}

function compareDurationDesc(left: VideoSearchRecord, right: VideoSearchRecord): number {
  const leftKnown = hasKnownDuration(left);
  const rightKnown = hasKnownDuration(right);

  if (leftKnown && rightKnown) {
    return (right.durationMs || 0) - (left.durationMs || 0);
  }

  if (leftKnown !== rightKnown) {
    return leftKnown ? -1 : 1;
  }

  return right.publishedAt.localeCompare(left.publishedAt);
}

function compareDurationAsc(left: VideoSearchRecord, right: VideoSearchRecord): number {
  const leftKnown = hasKnownDuration(left);
  const rightKnown = hasKnownDuration(right);

  if (leftKnown && rightKnown) {
    return (left.durationMs || 0) - (right.durationMs || 0);
  }

  if (leftKnown !== rightKnown) {
    return leftKnown ? -1 : 1;
  }

  return right.publishedAt.localeCompare(left.publishedAt);
}
