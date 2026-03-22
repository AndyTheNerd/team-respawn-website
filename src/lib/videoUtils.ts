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

export type FormatTag = 'short' | 'medium' | 'long';

export type SortOption = 'newest' | 'oldest' | 'shortest' | 'longest' | 'relevance';

export interface TaggedVideo extends Video {
  game: GameTag;
  series: SeriesTag;
  format: FormatTag;
  year: number;
}

// Short: durationMs !== null && < 120s
// Long: durationMs === null || >= 30 min
// Medium: everything else
export function getFormat(durationMs: number | null): FormatTag {
  if (durationMs === null || durationMs >= 1_800_000) return 'long';
  if (durationMs < 120_000) return 'short';
  return 'medium';
}

export function getGame(title: string): GameTag {
  const t = title.toLowerCase();
  // Specific games first to avoid partial matches
  if (/\bhalo wars 2\b|\bhw2\b/.test(t)) return 'halo-wars-2';
  if (/\bhalo wars\b|\bhw1\b/.test(t)) return 'halo-wars-1';
  if (/\bage of empires (iv|4)\b|\baoe ?4\b/.test(t)) return 'aoe4';
  if (/\bage of empires (ii|2)\b|\baoe ?2\b/.test(t)) return 'aoe2';
  if (/\bage of mythology\b|\baom\b/.test(t)) return 'aom';
  if (
    /\bhalo infinite\b|\bhalo (3|4|2|reach|ce|combat evolved)\b|\bhalo mcc\b|\bhalo odst\b|\bhalo fps\b|\bhalo campaign\b/.test(t)
  )
    return 'halo-fps';
  if (/\bgears( of war)?\b/.test(t)) return 'gears';
  if (/\bgoblin commander\b/.test(t)) return 'goblin-commander';
  if (/\bcommand (and|&) conquer\b|\bred alert\b|\bc&c\b|\bkane.s wrath\b/.test(t)) return 'command-and-conquer';
  if (/\bcompany of heroes\b|\bcoh\b/.test(t)) return 'company-of-heroes';
  if (/\btempest rising\b/.test(t)) return 'tempest-rising';
  if (/\bspellforce\b|\bconquest of eo\b/.test(t)) return 'spellforce';
  if (/\bashes of the singularity\b/.test(t)) return 'ashes';
  return 'other';
}

export function getSeries(title: string, format: FormatTag): SeriesTag {
  const t = title.toLowerCase();
  if (/\bmythbuster/.test(t)) return 'mythbusters';
  if (/\bsuper turtle\b/.test(t)) return 'super-turtle';
  if (/\bwalkthrough\b|\bfull campaign\b|\bfull legendary\b/.test(t)) return 'walkthrough';
  if (/\breview\b|\bfirst impressions?\b/.test(t)) return 'review';
  if (/\bhow to\b|\bguide\b|\btips?\b|\bstrategy\b/.test(t)) return 'guide';
  return 'general';
}

export function tagVideo(video: Video): TaggedVideo {
  const format = getFormat(video.durationMs);
  const game = video.game ?? getGame(video.title);
  const series = video.series ?? getSeries(video.title, format);
  const year = video.publishedAt ? parseInt(video.publishedAt.slice(0, 4), 10) : 0;
  return { ...video, game, series, format, year };
}

// Relevance scoring for title search
export function scoreTitle(title: string, query: string): number {
  const t = title.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  let score = 0;
  if (t === q) score += 200;
  if (t.startsWith(q)) score += 80;
  const words = q.split(/\s+/);
  for (const word of words) {
    if (t.includes(word)) score += 20;
  }
  if (t.includes(q)) score += 40;
  return score;
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return '';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const GAME_LABELS: Record<GameTag, string> = {
  'halo-wars-2': 'Halo Wars 2',
  'halo-wars-1': 'Halo Wars',
  'aoe4': 'AoE IV',
  'aoe2': 'AoE II',
  'aom': 'Age of Mythology',
  'halo-fps': 'Halo FPS',
  'gears': 'Gears of War',
  'goblin-commander': 'Goblin Commander',
  'command-and-conquer': 'Command & Conquer',
  'company-of-heroes': 'Company of Heroes',
  'tempest-rising': 'Tempest Rising',
  'spellforce': 'Spellforce',
  'ashes': 'Ashes of the Singularity',
  'other': 'Other',
};

export const SERIES_LABELS: Record<SeriesTag, string> = {
  'mythbusters': 'Mythbusters',
  'super-turtle': 'Super Turtle',
  'walkthrough': 'Walkthrough',
  'guide': 'Guide',
  'review': 'Review',
  'general': 'General',
};

export const FORMAT_LABELS: Record<FormatTag, string> = {
  'short': 'Short (<2 min)',
  'medium': 'Medium (2–30 min)',
  'long': 'Long (30 min+)',
};
