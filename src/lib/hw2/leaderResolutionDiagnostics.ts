import type { LeaderResolutionResult } from './leaderResolution';

const loggedLeaderMismatchKeys = new Set<string>();

export function logLeaderResolutionMismatch(
  matchId: string,
  playerKey: string,
  resolution: LeaderResolutionResult
) {
  const rawEventConflict = resolution.rawLeaderId != null
    && resolution.eventLeaderId != null
    && resolution.rawLeaderId !== resolution.eventLeaderId;
  const resolvedRawConflict = resolution.rawLeaderId != null
    && resolution.resolvedLeaderId != null
    && resolution.rawLeaderId !== resolution.resolvedLeaderId;

  if (!rawEventConflict && !resolvedRawConflict) return;

  const dedupeKey = [
    matchId,
    playerKey,
    resolution.rawLeaderId ?? 'null',
    resolution.eventLeaderId ?? 'null',
    resolution.inferredLeaderId ?? 'null',
    resolution.resolvedLeaderId ?? 'null',
  ].join('|');
  if (loggedLeaderMismatchKeys.has(dedupeKey)) return;
  loggedLeaderMismatchKeys.add(dedupeKey);

  console.warn({
    type: 'leader_mismatch',
    matchId,
    playerKey,
    rawLeaderId: resolution.rawLeaderId,
    eventLeaderId: resolution.eventLeaderId,
    inferredLeaderId: resolution.inferredLeaderId,
    resolvedLeaderId: resolution.resolvedLeaderId,
    source: resolution.source,
    confidence: resolution.confidence,
    reason: resolution.reason,
  });
}
