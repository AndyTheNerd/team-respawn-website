import { getLeaderPowerMap, getGameObjectMap, getTechMap } from '../../utils/haloApi';
import { resolveAliasName, normalizeLeaderPowerId, normalizeGameObjectId, normalizeTechId, leaderPowerIdOverrideMap, unitIdOverrideMap, buildingIdOverrideMap, techIdOverrideMap, applyDisplayNameOverride } from './dataProcessing';

let leaderPowerMapCache: Record<string, string> | null = null;
let leaderPowerNormalizedMap: Map<string, string> | null = null;
let leaderPowerMapLoading: Promise<Record<string, string> | null> | null = null;
let gameObjectMapCache: Record<string, string> | null = null;
let gameObjectNormalizedMap: Map<string, string> | null = null;
let gameObjectMapLoading: Promise<Record<string, string> | null> | null = null;
let techMapCache: Record<string, string> | null = null;
let techNormalizedMap: Map<string, string> | null = null;
let techMapLoading: Promise<Record<string, string> | null> | null = null;

export async function ensureLeaderPowerMap(): Promise<Record<string, string> | null> {
  if (leaderPowerMapCache) return leaderPowerMapCache;
  if (leaderPowerMapLoading) return leaderPowerMapLoading;
  leaderPowerMapLoading = (async () => {
    const result = await getLeaderPowerMap();
    if (result.ok) {
      leaderPowerMapCache = result.data;
      leaderPowerNormalizedMap = new Map<string, string>();
      Object.entries(result.data).forEach(([id, name]) => {
        leaderPowerNormalizedMap!.set(normalizeLeaderPowerId(id), name);
      });
      return leaderPowerMapCache;
    }
    leaderPowerMapLoading = null;
    return null;
  })();
  return leaderPowerMapLoading;
}

export function humanizeLeaderPowerId(powerId: string): string {
  if (!powerId) return '';
  const normalized = powerId
    .replace(/_MP$/i, '')
    .replace(/_Proc$/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)\b/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.replace(/\b(\d)\b/g, (match) => {
    switch (match) {
      case '1': return 'I';
      case '2': return 'II';
      case '3': return 'III';
      case '4': return 'IV';
      case '5': return 'V';
      default: return match;
    }
  });
}

export function getLeaderPowerDisplayName(powerId: string, map?: Record<string, string> | null): string {
  if (!powerId) return '';
  if (map?.[powerId]) return map[powerId];
  const directAlias = resolveAliasName(powerId, ['powers']);
  if (directAlias) return directAlias;

  const candidates = [
    powerId,
    powerId.replace(/_MP$/i, ''),
    powerId.replace(/_Proc$/i, ''),
  ];
  if (!/_MP$/i.test(powerId)) candidates.push(`${powerId}_MP`);
  if (!/_Proc$/i.test(powerId)) candidates.push(`${powerId}_Proc`);

  for (const candidate of candidates) {
    if (map?.[candidate]) return map[candidate];
    const aliasHit = resolveAliasName(candidate, ['powers']);
    if (aliasHit) return aliasHit;
    const normalized = normalizeLeaderPowerId(candidate);
    const overrideHit = leaderPowerIdOverrideMap.get(normalized);
    if (overrideHit) return overrideHit;
    const normalizedHit = leaderPowerNormalizedMap?.get(normalized);
    if (normalizedHit) return normalizedHit;
    if (normalized.endsWith('mp')) {
      const noMp = normalized.slice(0, -2);
      const mpHit = leaderPowerNormalizedMap?.get(noMp);
      if (mpHit) return mpHit;
    } else {
      const mpHit = leaderPowerNormalizedMap?.get(`${normalized}mp`);
      if (mpHit) return mpHit;
    }
  }

  const humanized = humanizeLeaderPowerId(powerId);
  return resolveAliasName(humanized, ['powers']) || humanized;
}

export async function ensureGameObjectMap(): Promise<Record<string, string> | null> {
  if (gameObjectMapCache) return gameObjectMapCache;
  if (gameObjectMapLoading) return gameObjectMapLoading;
  gameObjectMapLoading = (async () => {
    const result = await getGameObjectMap();
    if (result.ok) {
      gameObjectMapCache = result.data;
      gameObjectNormalizedMap = new Map<string, string>();
      Object.entries(result.data).forEach(([id, name]) => {
        gameObjectNormalizedMap!.set(normalizeGameObjectId(id), name);
      });
      return gameObjectMapCache;
    }
    gameObjectMapLoading = null;
    return null;
  })();
  return gameObjectMapLoading;
}

export function humanizeGameObjectId(objectId: string): string {
  if (!objectId) return '';
  const normalized = objectId
    .replace(/_MP$/i, '')
    .replace(/_Proc$/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)\b/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized;
}

export function getGameObjectDisplayName(objectId: string, map?: Record<string, string> | null): string {
  if (!objectId) return '';
  if (map?.[objectId]) return applyDisplayNameOverride(map[objectId]);
  const aliasHit = resolveAliasName(objectId, ['units', 'buildings']);
  if (aliasHit) return applyDisplayNameOverride(aliasHit);
  const normalized = normalizeGameObjectId(objectId);
  const overrideHit = unitIdOverrideMap.get(normalized) || buildingIdOverrideMap.get(normalized);
  if (overrideHit) return applyDisplayNameOverride(overrideHit);
  const normalizedHit = gameObjectNormalizedMap?.get(normalized);
  if (normalizedHit) return applyDisplayNameOverride(normalizedHit);
  const humanized = humanizeGameObjectId(objectId);
  const humanAlias = resolveAliasName(humanized, ['units', 'buildings']);
  return applyDisplayNameOverride(humanAlias || humanized);
}

export async function ensureTechMap(): Promise<Record<string, string> | null> {
  if (techMapCache) return techMapCache;
  if (techMapLoading) return techMapLoading;
  techMapLoading = (async () => {
    const result = await getTechMap();
    if (result.ok) {
      techMapCache = result.data;
      techNormalizedMap = new Map<string, string>();
      Object.entries(result.data).forEach(([id, name]) => {
        techNormalizedMap!.set(normalizeTechId(id), name);
      });
      return techMapCache;
    }
    techMapLoading = null;
    return null;
  })();
  return techMapLoading;
}

export function humanizeTechId(techId: string): string {
  if (!techId) return '';
  const normalized = techId
    .replace(/_MP$/i, '')
    .replace(/_Proc$/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)\b/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized;
}

export function getTechDisplayName(techId: string, map?: Record<string, string> | null): string {
  if (!techId) return '';
  if (map?.[techId]) return applyDisplayNameOverride(map[techId]);
  const aliasHit = resolveAliasName(techId, ['tech']);
  if (aliasHit) return applyDisplayNameOverride(aliasHit);
  const normalized = normalizeTechId(techId);
  const overrideHit = techIdOverrideMap.get(normalized);
  if (overrideHit) return applyDisplayNameOverride(overrideHit);
  const normalizedHit = techNormalizedMap?.get(normalized);
  if (normalizedHit) return applyDisplayNameOverride(normalizedHit);
  const humanized = humanizeTechId(techId);
  const humanAlias = resolveAliasName(humanized, ['tech']);
  return applyDisplayNameOverride(humanAlias || humanized);
}
