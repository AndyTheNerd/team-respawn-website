import type { VideoCta, Hw2NameMappings, AliasLookup, TimelineEntry } from './types';
import { MIN_HW2_VIDEO_DURATION_MS } from './state';
import { videoCtaEl, videoThumbEl, videoTitleEl, videoDateEl, videoLinkEl, videoDataEl, nameMapsEl, playerLastSeenEl } from './dom';
import { getLeaderName } from '../../data/haloWars2/leaders';

// --- Video CTA ---

const hw2VideoList: VideoCta[] = (() => {
  if (!videoDataEl?.textContent) return [];
  try {
    const parsed = JSON.parse(videoDataEl.textContent);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => {
      if (!entry?.title || !entry?.videoId) return false;
      if (!Number.isFinite(entry.durationMs)) return false;
      return entry.durationMs >= MIN_HW2_VIDEO_DURATION_MS;
    });
  } catch {
    return [];
  }
})();

export function formatVideoDuration(durationMs?: number): string {
  if (!durationMs || !Number.isFinite(durationMs)) return '';
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function renderVideoCta() {
  if (!videoCtaEl) return;
  if (hw2VideoList.length === 0) {
    videoCtaEl.classList.add('hidden');
    return;
  }
  const choice = hw2VideoList[Math.floor(Math.random() * hw2VideoList.length)];
  const url = `https://www.youtube.com/watch?v=${choice.videoId}`;
  const thumb = `https://img.youtube.com/vi/${choice.videoId}/hqdefault.jpg`;
  const dateLabel = choice.publishedAt
    ? new Date(choice.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const durationLabel = formatVideoDuration(choice.durationMs);
  const metaBits = [dateLabel ? `Published ${dateLabel}` : '', durationLabel ? `Duration ${durationLabel}` : '']
    .filter(Boolean)
    .join(' • ');
  if (videoTitleEl) videoTitleEl.textContent = choice.title;
  if (videoDateEl) videoDateEl.textContent = metaBits;
  if (videoLinkEl) videoLinkEl.href = url;
  if (videoThumbEl) {
    videoThumbEl.src = thumb;
    videoThumbEl.alt = `Team Respawn video: ${choice.title}`;
  }
  videoCtaEl.classList.remove('hidden');
}

// --- Name Mappings & Alias Resolution ---

const hw2NameMappings: Hw2NameMappings | null = (() => {
  if (!nameMapsEl?.textContent) return null;
  try {
    return JSON.parse(nameMapsEl.textContent) as Hw2NameMappings;
  } catch {
    return null;
  }
})();

export function normalizeAliasKey(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

const aliasLookup: AliasLookup = (() => {
  const lookup: AliasLookup = {
    leaders: new Map(),
    powers: new Map(),
    units: new Map(),
    buildings: new Map(),
    tech: new Map(),
  };
  const aliases = hw2NameMappings?.aliases;
  if (!aliases) return lookup;

  const load = (target: Map<string, string>, source?: Record<string, string>) => {
    if (!source) return;
    Object.entries(source).forEach(([key, value]) => {
      const normalized = normalizeAliasKey(key);
      if (normalized) target.set(normalized, value);
    });
  };

  load(lookup.leaders, aliases.leaders);
  load(lookup.powers, aliases.powers);
  load(lookup.units, aliases.units);
  load(lookup.buildings, aliases.buildings);
  load(lookup.tech, aliases.tech);

  return lookup;
})();

export function resolveAliasName(value: string, kinds: Array<keyof AliasLookup>): string | null {
  if (!value) return null;
  const normalized = normalizeAliasKey(value);
  if (!normalized) return null;
  for (const kind of kinds) {
    const hit = aliasLookup[kind]?.get(normalized);
    if (hit) return hit;
  }
  return null;
}

export function buildNormalizedIdMap(source: Record<string, string> | undefined, normalize: (value: string) => string) {
  const map = new Map<string, string>();
  if (!source) return map;
  Object.entries(source).forEach(([key, value]) => {
    const normalized = normalize(key);
    if (!normalized) return;
    if (!map.has(normalized)) map.set(normalized, value);
  });
  return map;
}

// Forward-declare normalize functions (used by buildNormalizedIdMap calls below)
export function normalizeLeaderPowerId(powerId: string): string {
  return powerId.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizeGameObjectId(objectId: string): string {
  return objectId.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizeTechId(techId: string): string {
  return techId.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const leaderPowerIdOverrideMap = buildNormalizedIdMap(hw2NameMappings?.idMaps?.leaderPowers, normalizeLeaderPowerId);
export const unitIdOverrideMap = buildNormalizedIdMap(hw2NameMappings?.idMaps?.units, normalizeGameObjectId);
export const buildingIdOverrideMap = buildNormalizedIdMap(hw2NameMappings?.idMaps?.buildings, normalizeGameObjectId);
export const techIdOverrideMap = buildNormalizedIdMap(hw2NameMappings?.idMaps?.upgrades, normalizeTechId);

// --- Last Seen ---

export function updateLastSeen(matches: any[]) {
  if (!playerLastSeenEl) return;
  if (!Array.isArray(matches) || matches.length === 0) {
    playerLastSeenEl.textContent = '';
    playerLastSeenEl.classList.add('hidden');
    return;
  }
  let latestMs = 0;
  matches.forEach((match) => {
    const iso = match?.MatchStartDate?.ISO8601Date;
    if (!iso) return;
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms)) return;
    if (ms > latestMs) latestMs = ms;
  });
  if (!latestMs) {
    playerLastSeenEl.textContent = '';
    playerLastSeenEl.classList.add('hidden');
    return;
  }
  const label = new Date(latestMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  playerLastSeenEl.textContent = `Last seen ${label}`;
  playerLastSeenEl.classList.remove('hidden');
}

// --- Duration Parsing ---

export function parseDurationParts(iso?: string) {
  if (!iso) return { weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const match = iso.match(/P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?/);
  if (!match) return { weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    weeks: parseInt(match[1] || '0'),
    days: parseInt(match[2] || '0'),
    hours: parseInt(match[3] || '0'),
    minutes: parseInt(match[4] || '0'),
    seconds: parseFloat(match[5] || '0'),
  };
}

export function parseDuration(iso: string): string {
  const parts = parseDurationParts(iso);
  let totalSeconds = parts.seconds
    + parts.minutes * 60
    + parts.hours * 3600
    + (parts.days + parts.weeks * 7) * 86400;
  if (totalSeconds <= 0) return '0h';

  const totalDays = Math.floor(totalSeconds / 86400);
  totalSeconds -= totalDays * 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds -= hours * 3600;
  const minutes = Math.round(totalSeconds / 60);

  if (totalDays > 0) return hours > 0 ? `${totalDays}d ${hours}h` : `${totalDays}d`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return '<1m';
}

export function parseDurationHours(iso?: string): number {
  const parts = parseDurationParts(iso);
  return (parts.weeks * 7 + parts.days) * 24
    + parts.hours
    + parts.minutes / 60
    + parts.seconds / 3600;
}

export function formatMatchClock(ms?: number): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return '';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// --- Stats Summaries ---

export function getMatchmakingSummaries(statsData: any): any[] {
  if (Array.isArray(statsData)) {
    return statsData.filter((s: any) => s && s.PlaylistId);
  }
  const mm = statsData?.MatchmakingSummary;
  if (!mm) return [];
  const social = Array.isArray(mm.SocialPlaylistStats) ? mm.SocialPlaylistStats : [];
  const ranked = Array.isArray(mm.RankedPlaylistStats) ? mm.RankedPlaylistStats : [];
  return [...social, ...ranked];
}

export function getCustomSummaries(statsData: any): any[] {
  const custom = statsData?.CustomSummary;
  if (!custom) return [];
  const summaries = [];
  if (custom.CustomStats) summaries.push(custom.CustomStats);
  const skirmish = custom.SkirmishStats;
  if (skirmish?.SinglePlayerStats) summaries.push(skirmish.SinglePlayerStats);
  if (skirmish?.MultiplayerStats) summaries.push(skirmish.MultiplayerStats);
  return summaries;
}

export function sumSummaryTotals(summaries: any[]) {
  let matches = 0;
  let wins = 0;
  let time = 0;
  summaries.forEach((s: any) => {
    matches += getMatchesStarted(s);
    wins += getMatchesWon(s);
    time += parseDurationHours(getTotalTimePlayed(s));
  });
  return { matches, wins, time };
}

// --- Leader Stats ---

export function buildLeaderStatsFromMatches(matches: any[]): Map<number, { matches: number; wins: number }> {
  const map = new Map<number, { matches: number; wins: number }>();
  if (!Array.isArray(matches)) return map;
  matches.forEach((match: any) => {
    if (match.MatchType != null && match.MatchType !== 3) return;
    const leaderId = match.LeaderId
      ?? match.Players?.[match.PlayerIndex || 0]?.LeaderId
      ?? match.Players?.[0]?.LeaderId;
    if (leaderId == null) return;
    const rawOutcome = match.PlayerMatchOutcome
      ?? match.MatchOutcome
      ?? match.MatchResult
      ?? match.Players?.[match.PlayerIndex || 0]?.MatchOutcome
      ?? match.Players?.[0]?.MatchOutcome;
    const outcome = typeof rawOutcome === 'string' ? rawOutcome.toLowerCase() : rawOutcome;
    const isWin = outcome === 1 || outcome === 'win' || outcome === 'victory';
    const prev = map.get(leaderId) || { matches: 0, wins: 0 };
    map.set(leaderId, { matches: prev.matches + 1, wins: prev.wins + (isWin ? 1 : 0) });
  });
  return map;
}

export function renderLeaderRows(entries: Array<[number, { matches: number; wins: number }]>, maxCount: number, leaderColorMap?: Map<number, string>, showSwatch = false) {
  return entries.map(([leaderId, data]) => {
    const name = getLeaderName(leaderId);
    const pct = maxCount > 0 ? (data.matches / maxCount) * 100 : 0;
    const winRateValue = data.matches > 0 ? (data.wins / data.matches) * 100 : 0;
    const winRate = winRateValue.toFixed(1);
    const winPct = Math.min(100, Math.max(0, winRateValue));
    const leaderColor = leaderColorMap?.get(leaderId) || '#64748b';

    return `
      <div class="flex items-center gap-3">
        <div class="w-28 sm:w-36 flex items-center gap-2 flex-shrink-0">
          ${showSwatch ? `<span class="inline-block w-2.5 h-2.5 rounded-sm" style="background: ${leaderColor};"></span>` : ''}
          <span class="text-sm text-white truncate">${name}</span>
        </div>
        <div class="flex-1 h-6 bg-slate-700/30 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500" style="width: ${pct}%; background: linear-gradient(90deg, rgba(34,197,94,0.85) 0%, rgba(34,197,94,0.85) ${winPct}%, rgba(239,68,68,0.85) ${winPct}%, rgba(239,68,68,0.85) 100%);"></div>
        </div>
        <span class="text-sm font-mono text-gray-300 w-10 text-right flex-shrink-0">${data.matches}</span>
        <span class="text-xs font-mono text-cyan-300 w-12 text-right flex-shrink-0">${winRate}%</span>
      </div>
    `;
  }).join('');
}

// --- Terminus Wave ---

export function getHighestTerminusWave(statsData: any): number {
  const mm = statsData?.MatchmakingSummary;
  const socialMode = Array.isArray(mm?.SocialModeStats) ? mm.SocialModeStats : [];
  const rankedMode = Array.isArray(mm?.RankedModeStats) ? mm.RankedModeStats : [];
  const custom = statsData?.CustomSummary;
  const customMode = Array.isArray(custom?.CustomModeStats) ? custom.CustomModeStats : [];
  const skirmish = custom?.SkirmishStats;
  const skirmishSingle = Array.isArray(skirmish?.SinglePlayerModeStats) ? skirmish.SinglePlayerModeStats : [];
  const skirmishMulti = Array.isArray(skirmish?.MultiplayerModeStats) ? skirmish.MultiplayerModeStats : [];
  const modeStats = [
    ...socialMode,
    ...rankedMode,
    ...customMode,
    ...skirmishSingle,
    ...skirmishMulti,
  ];

  let maxWave = 0;
  modeStats.forEach((s: any) => {
    if (s?.GameMode !== 10) return;
    const wave = s?.HighestWaveCompleted ?? 0;
    if (wave > maxWave) maxWave = wave;
  });

  return maxWave;
}

// --- Match Stat Getters ---

export function getMatchesStarted(stat: any): number {
  return stat?.TotalMatchesStarted ?? stat?.MatchesStarted ?? 0;
}

export function getMatchesWon(stat: any): number {
  return stat?.TotalMatchesWon ?? stat?.MatchesWon ?? 0;
}

export function getMatchesLost(stat: any): number {
  return stat?.TotalMatchesLost ?? stat?.MatchesLost ?? 0;
}

export function getMatchesCompleted(stat: any): number {
  return stat?.TotalMatchesCompleted ?? stat?.MatchesCompleted ?? 0;
}

export function getTotalTimePlayed(stat: any): string {
  return stat?.TotalTimePlayed || 'PT0S';
}

export function getGameModeName(mode?: number): string {
  switch (mode) {
    case 1: return 'Campaign Solo';
    case 2: return 'Campaign Co-op';
    case 3: return 'Deathmatch';
    case 4: return 'Domination';
    case 5: return 'Strongholds';
    case 6: return 'Blitz';
    case 7: return 'Firefight';
    case 8: return 'Tutorial';
    case 9: return 'Blitz Tutorial';
    case 10: return 'Terminus Firefight';
    default: return '';
  }
}

export function findMatchPlayer(match: any, gamertag: string) {
  const gtLower = gamertag.toLowerCase();
  const rawPlayers = match?.Players;
  const players = Array.isArray(rawPlayers)
    ? rawPlayers
    : (rawPlayers && typeof rawPlayers === 'object')
      ? Object.values(rawPlayers)
      : [];
  const player = players.find((p: any) => {
    const id =
      p?.HumanPlayerId?.Gamertag
      || (typeof p?.HumanPlayerId === 'string' ? p.HumanPlayerId : '')
      || p?.Gamertag
      || p?.PlayerId;
    return id && String(id).toLowerCase() === gtLower;
  }) || players[0] || null;
  return player;
}

// --- Tech Tier Detection ---

export function detectTechTierFromBuildingUpgrade(buildingId: string, buildingName = ''): 2 | 3 | null {
  if (!buildingId && !buildingName) return null;
  const id = String(buildingId || '').toLowerCase();
  const name = String(buildingName || '').toLowerCase();
  const looksLikeMainBase =
    id.includes('bldg_command')
    || id.includes('bldg_builder')
    || name.includes('main base');
  if (!looksLikeMainBase) return null;
  if (/(?:_0?3)$/.test(id) || /(?:^|[^a-z0-9])level\s*3(?:[^a-z0-9]|$)/.test(name)) return 2;
  if (/(?:_0?4)$/.test(id) || /(?:^|[^a-z0-9])level\s*4(?:[^a-z0-9]|$)/.test(name)) return 3;
  return null;
}

export function renderTechTierBadge(entry: TimelineEntry): string {
  if (entry.techTier === 2) {
    return '<span class="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider border-cyan-300/50 text-cyan-100 bg-cyan-400/15">Tech 2</span>';
  }
  if (entry.techTier === 3) {
    return '<span class="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider border-fuchsia-300/50 text-fuchsia-100 bg-fuchsia-400/15">Tech 3</span>';
  }
  return '';
}

// --- Display Name Overrides ---

const displayNameOverrides: Record<string, string> = {
  'Pegasus': 'Frostraven',
};

export function applyDisplayNameOverride(name: string): string {
  return displayNameOverrides[name] || name;
}
