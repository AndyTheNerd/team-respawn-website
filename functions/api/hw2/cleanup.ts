import { errorResponse, jsonResponse } from './_shared';

type D1PreparedStatement = {
  bind: (...args: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
  run: () => Promise<{ meta: { changes: number } }>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: unknown[]) => Promise<unknown>;
};

type Env = {
  DB?: D1Database;
  CLEANUP_SECRET?: string;
};

const PLAYER_CACHE_DAYS = 30;
const RAW_PAYLOAD_DAYS = 60;
const METADATA_CACHE_DAYS = 90;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return errorResponse(
      { type: 'unknown', message: 'Database not configured. Bind D1 as DB.' },
      500
    );
  }

  const url = new URL(request.url);
  const secret = url.searchParams.get('secret') || '';

  if (!env.CLEANUP_SECRET || secret !== env.CLEANUP_SECRET) {
    return errorResponse({ type: 'auth', message: 'Unauthorized.' }, 401);
  }

  const playerCutoff = daysAgo(PLAYER_CACHE_DAYS);
  const rawCutoff = daysAgo(RAW_PAYLOAD_DAYS);
  const metadataCutoff = daysAgo(METADATA_CACHE_DAYS);

  const playerStats = await env.DB.prepare(
    'DELETE FROM player_stats_cache WHERE fetched_at < ?'
  ).bind(playerCutoff).run();

  const playerSeasonStats = await env.DB.prepare(
    'DELETE FROM player_season_stats_cache WHERE fetched_at < ?'
  ).bind(playerCutoff).run();

  const playerCampaign = await env.DB.prepare(
    'DELETE FROM player_campaign_cache WHERE fetched_at < ?'
  ).bind(playerCutoff).run();

  const playerMatches = await env.DB.prepare(
    'DELETE FROM player_matches_cache WHERE fetched_at < ?'
  ).bind(playerCutoff).run();

  const metadata = await env.DB.prepare(
    'DELETE FROM metadata_cache WHERE fetched_at < ?'
  ).bind(metadataCutoff).run();

  const campaignLevels = await env.DB.prepare(
    'DELETE FROM campaign_levels_cache WHERE fetched_at < ?'
  ).bind(metadataCutoff).run();

  const rawMatches = await env.DB.prepare(
    'DELETE FROM raw_match_payloads WHERE fetched_at < ?'
  ).bind(rawCutoff).run();

  const rawEvents = await env.DB.prepare(
    'DELETE FROM raw_event_payloads WHERE fetched_at < ?'
  ).bind(rawCutoff).run();

  return jsonResponse({
    deleted: {
      player_stats_cache: playerStats.meta?.changes ?? 0,
      player_season_stats_cache: playerSeasonStats.meta?.changes ?? 0,
      player_campaign_cache: playerCampaign.meta?.changes ?? 0,
      player_matches_cache: playerMatches.meta?.changes ?? 0,
      metadata_cache: metadata.meta?.changes ?? 0,
      campaign_levels_cache: campaignLevels.meta?.changes ?? 0,
      raw_match_payloads: rawMatches.meta?.changes ?? 0,
      raw_event_payloads: rawEvents.meta?.changes ?? 0,
    },
    retention: {
      player_caches: `${PLAYER_CACHE_DAYS} days`,
      raw_payloads: `${RAW_PAYLOAD_DAYS} days`,
      metadata: `${METADATA_CACHE_DAYS} days`,
    },
    cleanedAt: new Date().toISOString(),
  });
};
