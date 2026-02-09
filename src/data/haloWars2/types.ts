export interface CsrTier {
  title: string;
  imageUrl: string;
}

export interface CsrRank {
  title: string;
  tiers: Record<number, CsrTier>;
}

export interface Leader {
  id: number;
  name: string;
  displayName: string;
  faction: 'UNSC' | 'Banished';
  imageUrl: string;
}

export interface HaloMap {
  id: string;
  name: string;
  imageUrl: string;
  cloudinaryId?: string;
  cloudinaryUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  displayName: string;
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
}

export interface PlayerStatSummary {
  TotalTimePlayed: string;
  MatchesStarted: number;
  MatchesCompleted: number;
  MatchesWon: number;
  MatchesLost: number;
  GameMode?: number;
  PlaylistId?: string;
  LeaderStats?: LeaderStat[];
  RankedPlaylistStats?: RankedPlaylistStat[];
}

export interface PlayerStatsSummaryResponse {
  MatchmakingSummary?: MatchmakingSummary;
  CustomSummary?: CustomSummary;
}

export interface SeasonStatsResponse {
  SeasonId: string;
  RankedPlaylistStats?: SummaryEntry[];
}

export interface MatchmakingSummary {
  SocialPlaylistStats?: SummaryEntry[];
  RankedPlaylistStats?: SummaryEntry[];
  SocialModeStats?: SummaryEntry[];
  RankedModeStats?: SummaryEntry[];
}

export interface CustomSummary {
  SkirmishStats?: {
    SinglePlayerStats?: SummaryEntry;
    MultiplayerStats?: SummaryEntry;
    SinglePlayerModeStats?: SummaryEntry[];
    MultiplayerModeStats?: SummaryEntry[];
  };
  CustomStats?: SummaryEntry;
  CustomModeStats?: SummaryEntry[];
}

export interface SummaryEntry {
  PlaylistId?: string;
  PlaylistClassification?: number;
  HighestCsr?: CsrValue;
  TotalTimePlayed?: string;
  TotalMatchesStarted?: number;
  TotalMatchesCompleted?: number;
  TotalMatchesWon?: number;
  TotalMatchesLost?: number;
  TotalPointCaptures?: number;
  TotalUnitsBuilt?: number;
  TotalUnitsLost?: number;
  TotalUnitsDestroyed?: number;
  TotalCardPlays?: number;
  HighestWaveCompleted?: number;
  LeaderStats?: SummaryLeaderStats;
  GameMode?: number;
  HighestObjectiveScoreByTeamSize?: Record<string, number>;
}

export interface SummaryLeaderStats {
  [leaderId: string]: SummaryLeaderStat;
}

export interface SummaryLeaderStat {
  TotalTimePlayed?: string;
  TotalMatchesStarted?: number;
  TotalMatchesCompleted?: number;
  TotalMatchesWon?: number;
  TotalMatchesLost?: number;
  TotalLeaderPowersCast?: number;
}

export interface LeaderStat {
  LeaderId: number;
  TotalTimePlayed: string;
  MatchesStarted: number;
  MatchesCompleted: number;
  MatchesWon: number;
  MatchesLost: number;
}

export interface RankedPlaylistStat {
  PlaylistId: string;
  HighestCsr: CsrValue;
  CurrentCsr: CsrValue;
  TotalTimePlayed: string;
  MatchesStarted: number;
  MatchesCompleted: number;
  MatchesWon: number;
  MatchesLost: number;
}

export interface CsrValue {
  Designation: number;
  Tier: number;
  PercentToNextTier: number;
  Raw: number;
  Rank?: number;
}

export interface MatchResult {
  MatchId: string;
  MatchType: number;
  GameMode: number;
  SeasonId?: string;
  PlaylistId?: string;
  MapId: string;
  MatchStartDate: { ISO8601Date: string };
  Players?: MatchPlayer[];
  LeaderId?: number;
  PlayerMatchOutcome?: number;
  PlayerMatchDuration?: string;
  PlayerIndex?: number;
  TeamId?: number;
  TeamPlayerIndex?: number;
}

export interface MatchPlayer {
  HumanPlayerId?: string;
  PlayerType: number;
  TeamId: number;
  LeaderId: number;
  MatchOutcome: number; // 1 = Win, 2 = Loss, 3 = Draw
}

export interface ApiError {
  type: 'not_found' | 'rate_limit' | 'auth' | 'network' | 'unknown';
  message: string;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
