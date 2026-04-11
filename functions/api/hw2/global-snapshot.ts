import { errorResponse, jsonResponse } from './_shared';

type D1PreparedStatement = {
  bind: (...args: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: unknown[]) => Promise<unknown>;
};

type Env = {
  DB?: D1Database;
  SNAPSHOT_SECRET?: string;
};

type SnapshotRunRow = {
  snapshot_id: string;
  dataset_key: string;
  source_type: string;
  source_label: string;
  generated_at: string;
};

type SnapshotSummaryRow = {
  playlist_id: string;
  playlist_name: string | null;
  total_matches: number;
  total_players: number;
  avg_duration_seconds: number | null;
  median_units_destroyed: number | null;
  median_units_lost: number | null;
  median_powers_per_player: number | null;
  quit_rate: number | null;
  sample_high_rank_players: number | null;
  sample_mid_rank_players: number | null;
  sample_match_count: number | null;
  trend_days: number | null;
};

type SnapshotMapRow = {
  map_id: string;
  match_count: number;
  median_seconds: number | null;
};

type SnapshotLeaderRow = {
  leader_id: number;
  match_count: number;
  win_count: number;
};

type SnapshotLeaderboardRow = {
  rank_position: number;
  player_id: string | null;
  gamertag: string;
  rating: number | null;
  tier: string | null;
  movement: number | null;
};

type IncomingSnapshotPayload = {
  snapshotId?: string;
  datasetKey?: string;
  sourceType?: string;
  sourceLabel?: string;
  generatedAt?: string;
  notes?: Record<string, unknown> | null;
  playlists?: IncomingPlaylistSnapshot[];
};

type IncomingPlaylistSnapshot = {
  playlistId?: string;
  playlistName?: string | null;
  totalMatches?: number;
  totalPlayers?: number;
  avgDurationSeconds?: number | null;
  medianUnitsDestroyed?: number | null;
  medianUnitsLost?: number | null;
  medianPowersPerPlayer?: number | null;
  quitRate?: number | null;
  sampleHighRankPlayers?: number | null;
  sampleMidRankPlayers?: number | null;
  sampleMatchCount?: number | null;
  trendDays?: number | null;
  mapStats?: IncomingMapSnapshot[];
  leaderStats?: IncomingLeaderSnapshot[];
  leaderboard?: IncomingLeaderboardEntry[];
};

type IncomingMapSnapshot = {
  mapId?: string;
  matchCount?: number;
  medianSeconds?: number | null;
};

type IncomingLeaderSnapshot = {
  leaderId?: number;
  matchCount?: number;
  winCount?: number;
};

type IncomingLeaderboardEntry = {
  rank?: number;
  playerId?: string | null;
  gamertag?: string;
  rating?: number | null;
  tier?: string | null;
  movement?: number | null;
};

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInt(value: unknown, fallback = 0): number {
  const parsed = toNumber(value);
  return parsed == null ? fallback : Math.round(parsed);
}

function normalizeIsoDate(value?: string): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function readSecret(request: Request): string {
  return request.headers.get('x-snapshot-secret')?.trim() || new URL(request.url).searchParams.get('secret')?.trim() || '';
}

async function getLatestSnapshotRun(db: D1Database, datasetKey: string): Promise<SnapshotRunRow | null> {
  return db.prepare(
    `SELECT snapshot_id, dataset_key, source_type, source_label, generated_at
     FROM hw2_snapshot_runs
     WHERE dataset_key = ?
     ORDER BY generated_at DESC
     LIMIT 1`
  ).bind(datasetKey).first<SnapshotRunRow>();
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) {
    return errorResponse({ type: 'unknown', message: 'Database not configured. Bind D1 as DB.' }, 500);
  }

  const url = new URL(request.url);
  const datasetKey = url.searchParams.get('dataset')?.trim() || 'global';
  const requestedPlaylistId = url.searchParams.get('playlist')?.trim() || '';

  const latest = await getLatestSnapshotRun(env.DB, datasetKey);
  if (!latest) {
    return jsonResponse({
      hasData: false,
      datasetKey,
      snapshot: null,
      availablePlaylists: [],
      selectedPlaylistId: null,
      summary: null,
      mapStats: [],
      leaderStats: [],
      leaderboard: [],
    });
  }

  const summaryRows = await env.DB.prepare(
    `SELECT
       playlist_id,
       playlist_name,
       total_matches,
       total_players,
       avg_duration_seconds,
       median_units_destroyed,
       median_units_lost,
       median_powers_per_player,
       quit_rate,
       sample_high_rank_players,
       sample_mid_rank_players,
       sample_match_count,
       trend_days
     FROM hw2_playlist_snapshot_summary
     WHERE snapshot_id = ?
     ORDER BY COALESCE(playlist_name, playlist_id) ASC`
  ).bind(latest.snapshot_id).all<SnapshotSummaryRow>();

  const summaries = summaryRows.results || [];
  const availablePlaylists = summaries.map((row) => ({
    id: row.playlist_id,
    label: row.playlist_name || row.playlist_id,
  }));
  const selectedPlaylistId = summaries.some((row) => row.playlist_id === requestedPlaylistId)
    ? requestedPlaylistId
    : (summaries[0]?.playlist_id || null);
  const selectedSummary = summaries.find((row) => row.playlist_id === selectedPlaylistId) || null;

  const [mapRows, leaderRows, leaderboardRows] = selectedPlaylistId
    ? await Promise.all([
        env.DB.prepare(
          `SELECT map_id, match_count, median_seconds
           FROM hw2_playlist_snapshot_maps
           WHERE snapshot_id = ? AND playlist_id = ?
           ORDER BY match_count DESC, map_id ASC`
        ).bind(latest.snapshot_id, selectedPlaylistId).all<SnapshotMapRow>(),
        env.DB.prepare(
          `SELECT leader_id, match_count, win_count
           FROM hw2_playlist_snapshot_leaders
           WHERE snapshot_id = ? AND playlist_id = ?
           ORDER BY match_count DESC, leader_id ASC`
        ).bind(latest.snapshot_id, selectedPlaylistId).all<SnapshotLeaderRow>(),
        env.DB.prepare(
          `SELECT rank_position, player_id, gamertag, rating, tier, movement
           FROM hw2_playlist_snapshot_leaderboards
           WHERE snapshot_id = ? AND playlist_id = ?
           ORDER BY rank_position ASC`
        ).bind(latest.snapshot_id, selectedPlaylistId).all<SnapshotLeaderboardRow>(),
      ])
    : [{ results: [] }, { results: [] }, { results: [] }];

  return jsonResponse({
    hasData: true,
    datasetKey,
    snapshot: {
      id: latest.snapshot_id,
      generatedAt: latest.generated_at,
      source: {
        type: latest.source_type,
        label: latest.source_label,
      },
    },
    availablePlaylists,
    selectedPlaylistId,
    summary: selectedSummary
      ? {
          playlistId: selectedSummary.playlist_id,
          playlistName: selectedSummary.playlist_name || selectedSummary.playlist_id,
          totalMatches: selectedSummary.total_matches,
          totalPlayers: selectedSummary.total_players,
          avgDurationSeconds: selectedSummary.avg_duration_seconds,
          medianUnitsDestroyed: selectedSummary.median_units_destroyed,
          medianUnitsLost: selectedSummary.median_units_lost,
          medianPowersPerPlayer: selectedSummary.median_powers_per_player,
          quitRate: selectedSummary.quit_rate,
          sampleHighRankPlayers: selectedSummary.sample_high_rank_players,
          sampleMidRankPlayers: selectedSummary.sample_mid_rank_players,
          sampleMatchCount: selectedSummary.sample_match_count,
          trendDays: selectedSummary.trend_days,
        }
      : null,
    mapStats: (mapRows.results || []).map((row) => ({
      mapId: row.map_id,
      matchCount: row.match_count,
      medianSeconds: row.median_seconds,
    })),
    leaderStats: (leaderRows.results || []).map((row) => ({
      leaderId: row.leader_id,
      matchCount: row.match_count,
      winCount: row.win_count,
      winRate: row.match_count > 0 ? (row.win_count / row.match_count) * 100 : null,
    })),
    leaderboard: (leaderboardRows.results || []).map((row) => ({
      rank: row.rank_position,
      playerId: row.player_id,
      gamertag: row.gamertag,
      rating: row.rating,
      tier: row.tier,
      movement: row.movement,
    })),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) {
    return errorResponse({ type: 'unknown', message: 'Database not configured. Bind D1 as DB.' }, 500);
  }

  const suppliedSecret = readSecret(request);
  if (!env.SNAPSHOT_SECRET || suppliedSecret !== env.SNAPSHOT_SECRET) {
    return errorResponse({ type: 'auth', message: 'Unauthorized.' }, 401);
  }

  let payload: IncomingSnapshotPayload | null = null;
  try {
    payload = await request.json<IncomingSnapshotPayload>();
  } catch {
    payload = null;
  }

  const playlists = Array.isArray(payload?.playlists) ? payload.playlists : [];
  if (playlists.length === 0) {
    return errorResponse({ type: 'unknown', message: 'At least one playlist snapshot is required.' }, 400);
  }

  const snapshotId = payload?.snapshotId?.trim() || crypto.randomUUID();
  const datasetKey = payload?.datasetKey?.trim() || 'global';
  const sourceType = payload?.sourceType?.trim() || 'scheduled_aggregate';
  const sourceLabel = payload?.sourceLabel?.trim() || 'scheduled aggregate dataset';
  const generatedAt = normalizeIsoDate(payload?.generatedAt);
  const createdAt = new Date().toISOString();
  const notesJson = payload?.notes ? JSON.stringify(payload.notes) : null;

  const statements: unknown[] = [
    env.DB.prepare('DELETE FROM hw2_playlist_snapshot_leaderboards WHERE snapshot_id = ?').bind(snapshotId),
    env.DB.prepare('DELETE FROM hw2_playlist_snapshot_leaders WHERE snapshot_id = ?').bind(snapshotId),
    env.DB.prepare('DELETE FROM hw2_playlist_snapshot_maps WHERE snapshot_id = ?').bind(snapshotId),
    env.DB.prepare('DELETE FROM hw2_playlist_snapshot_summary WHERE snapshot_id = ?').bind(snapshotId),
    env.DB.prepare('DELETE FROM hw2_snapshot_runs WHERE snapshot_id = ?').bind(snapshotId),
    env.DB.prepare(
      `INSERT INTO hw2_snapshot_runs (
         snapshot_id,
         dataset_key,
         source_type,
         source_label,
         generated_at,
         created_at,
         notes_json
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(snapshotId, datasetKey, sourceType, sourceLabel, generatedAt, createdAt, notesJson),
  ];

  let mapCount = 0;
  let leaderCount = 0;
  let leaderboardCount = 0;

  playlists.forEach((playlist) => {
    const playlistId = playlist?.playlistId?.trim() || '';
    if (!playlistId) return;

    statements.push(
      env.DB!.prepare(
        `INSERT INTO hw2_playlist_snapshot_summary (
           snapshot_id,
           playlist_id,
           playlist_name,
           total_matches,
           total_players,
           avg_duration_seconds,
           median_units_destroyed,
           median_units_lost,
           median_powers_per_player,
           quit_rate,
           sample_high_rank_players,
           sample_mid_rank_players,
           sample_match_count,
           trend_days
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        snapshotId,
        playlistId,
        playlist?.playlistName?.trim() || null,
        toInt(playlist?.totalMatches, 0),
        toInt(playlist?.totalPlayers, 0),
        toNumber(playlist?.avgDurationSeconds),
        toNumber(playlist?.medianUnitsDestroyed),
        toNumber(playlist?.medianUnitsLost),
        toNumber(playlist?.medianPowersPerPlayer),
        toNumber(playlist?.quitRate),
        toNumber(playlist?.sampleHighRankPlayers),
        toNumber(playlist?.sampleMidRankPlayers),
        toNumber(playlist?.sampleMatchCount),
        toNumber(playlist?.trendDays)
      )
    );

    (Array.isArray(playlist?.mapStats) ? playlist.mapStats : []).forEach((mapStat) => {
      const mapId = mapStat?.mapId?.trim() || '';
      if (!mapId) return;
      mapCount += 1;
      statements.push(
        env.DB!.prepare(
          `INSERT INTO hw2_playlist_snapshot_maps (
             snapshot_id,
             playlist_id,
             map_id,
             match_count,
             median_seconds
           ) VALUES (?, ?, ?, ?, ?)`
        ).bind(
          snapshotId,
          playlistId,
          mapId,
          toInt(mapStat?.matchCount, 0),
          toNumber(mapStat?.medianSeconds)
        )
      );
    });

    (Array.isArray(playlist?.leaderStats) ? playlist.leaderStats : []).forEach((leaderStat) => {
      const leaderId = toNumber(leaderStat?.leaderId);
      if (leaderId == null) return;
      leaderCount += 1;
      statements.push(
        env.DB!.prepare(
          `INSERT INTO hw2_playlist_snapshot_leaders (
             snapshot_id,
             playlist_id,
             leader_id,
             match_count,
             win_count
           ) VALUES (?, ?, ?, ?, ?)`
        ).bind(
          snapshotId,
          playlistId,
          Math.round(leaderId),
          toInt(leaderStat?.matchCount, 0),
          toInt(leaderStat?.winCount, 0)
        )
      );
    });

    (Array.isArray(playlist?.leaderboard) ? playlist.leaderboard : []).forEach((entry) => {
      const rank = toNumber(entry?.rank);
      const gamertag = entry?.gamertag?.trim() || '';
      if (rank == null || !gamertag) return;
      leaderboardCount += 1;
      statements.push(
        env.DB!.prepare(
          `INSERT INTO hw2_playlist_snapshot_leaderboards (
             snapshot_id,
             playlist_id,
             rank_position,
             player_id,
             gamertag,
             rating,
             tier,
             movement
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          snapshotId,
          playlistId,
          Math.round(rank),
          entry?.playerId?.trim() || null,
          gamertag,
          toNumber(entry?.rating),
          entry?.tier?.trim() || null,
          toNumber(entry?.movement)
        )
      );
    });
  });

  await env.DB.batch(statements);

  return jsonResponse({
    ok: true,
    snapshotId,
    datasetKey,
    generatedAt,
    inserted: {
      playlists: playlists.filter((playlist) => playlist?.playlistId?.trim()).length,
      maps: mapCount,
      leaders: leaderCount,
      leaderboardEntries: leaderboardCount,
    },
  });
};
