export type VideoCta = {
  title: string;
  publishedAt: string;
  videoId: string;
  durationMs?: number;
};

export type Hw2NameMappings = {
  aliases?: {
    leaders?: Record<string, string>;
    powers?: Record<string, string>;
    units?: Record<string, string>;
    buildings?: Record<string, string>;
    tech?: Record<string, string>;
  };
  idMaps?: {
    leaderPowers?: Record<string, string>;
    units?: Record<string, string>;
    buildings?: Record<string, string>;
    upgrades?: Record<string, string>;
  };
};

export type AliasLookup = {
  leaders: Map<string, string>;
  powers: Map<string, string>;
  units: Map<string, string>;
  buildings: Map<string, string>;
  tech: Map<string, string>;
};

export type ShareData = {
  matchId: string;
  gamertag: string;
  resultText: string;
  resultClass: 'win' | 'loss' | 'draw';
  mapName: string;
  mapImage: string;
  mapImageFallback: string;
  leaderName: string;
  dateStr: string;
  durationStr: string;
  playlistLabel: string;
  teamSizeLabel: string;
  powersText: string;
  unitsText: string;
  shareUrl: string;
  shareTitle: string;
  shareText: string;
};

export type ProfileShareData = {
  gamertag: string;
  subtitle: string;
  matches: string;
  wins: string;
  losses: string;
  winRate: string;
  viewerRating: string;
  timeStr: string;
  avgMatchStr: string;
  terminusWave: string;
  dateStr: string;
  shareUrl: string;
  shareTitle: string;
  shareText: string;
};

export type TimelineEntry = {
  timeMs: number;
  playerIndex: number | null;
  playerName: string;
  teamId: number | null;
  label: string;
  kind: 'building' | 'upgrade' | 'unit' | 'unit_upgrade' | 'power' | 'veterancy' | 'death' | 'recycle' | 'resource';
  detail?: string;
  techTier?: 2 | 3;
  supply?: number;
  energy?: number;
  commandXp?: number;
  population?: number;
  populationCap?: number;
};

export type PlayerInfo = {
  name: string;
  teamId: number | null;
  playerType: number | null;
  leaderId?: number | null;
};
