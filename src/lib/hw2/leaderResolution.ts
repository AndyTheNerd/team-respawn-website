export type LeaderResolutionSource = 'power-signature' | 'event' | 'raw' | 'unknown';
export type LeaderResolutionConfidence = 'high' | 'medium' | 'low' | 'none';

type LeaderPowerStats = Record<string, number | { TimesCast?: number; TotalPlays?: number }>;

type LeaderPowerSignature = {
  leaderId: number;
  patterns: RegExp[];
  strongPatterns?: RegExp[];
};

type InferLeaderResult = {
  leaderId: number | null;
  confidence: LeaderResolutionConfidence;
  matchedPowerIds: string[];
  tie: boolean;
};

export interface LeaderResolutionResult {
  resolvedLeaderId: number | null;
  source: LeaderResolutionSource;
  confidence: LeaderResolutionConfidence;
  rawLeaderId: number | null;
  eventLeaderId: number | null;
  inferredLeaderId: number | null;
  mismatch: boolean;
  reason: string;
  matchedPowerIds: string[];
}

export interface ResolveLeaderInput {
  rawLeaderId?: number | null;
  eventLeaderId?: number | null;
  leaderPowerStats?: LeaderPowerStats | null;
}

const LEADER_POWER_SIGNATURES: LeaderPowerSignature[] = [
  { leaderId: 16, patterns: [/^johnson/, /^unscbunkerdrop/, /^unscvehiclerecycle/, /^unscdiggingin/] },
  { leaderId: 9, patterns: [/^jerome/, /^powgplaserbarrage01/] },
  { leaderId: 3, patterns: [/^unscark/, /^unsclurebeacon/, /^unscretrieversentinel/] },
  { leaderId: 10, patterns: [/^arbiter/, /^stasisprojectileeffect/] },
  { leaderId: 15, patterns: [/^serina/, /^unscice/, /^unsccryo/] },
  { leaderId: 7, patterns: [/^unscforge/, /^unscheavymetal/] },
  { leaderId: 14, patterns: [/^unbrk/, /^unbrklich/, /^lichassault/, /^lichcall/], strongPatterns: [/^unbrk/, /^unbrklich/, /^lichassault/, /^lichcall/] },
  { leaderId: 13, patterns: [/^corrupted/, /^corruptedcataclysm/, /^corruptedpull/], strongPatterns: [/^corrupted/, /^corruptedcataclysm/, /^corruptedpull/] },
];

function normalizePowerId(powerId: string): string {
  return powerId.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseLeaderId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getPowerCount(rawValue: number | { TimesCast?: number; TotalPlays?: number }): number {
  if (typeof rawValue === 'number') return rawValue;
  return rawValue?.TimesCast ?? rawValue?.TotalPlays ?? 0;
}

export function inferLeaderIdFromPowerStats(leaderPowerStats?: LeaderPowerStats | null): InferLeaderResult {
  if (!leaderPowerStats || typeof leaderPowerStats !== 'object') {
    return { leaderId: null, confidence: 'none', matchedPowerIds: [], tie: false };
  }

  const scoreByLeader = new Map<number, number>();
  const matchedPowerIdsByLeader = new Map<number, Set<string>>();
  const strongMatchByLeader = new Map<number, boolean>();

  Object.entries(leaderPowerStats).forEach(([powerId, rawValue]) => {
    const times = getPowerCount(rawValue);
    if (!Number.isFinite(times) || times <= 0) return;

    const normalized = normalizePowerId(String(powerId));
    if (!normalized) return;

    for (const signature of LEADER_POWER_SIGNATURES) {
      if (!signature.patterns.some((pattern) => pattern.test(normalized))) continue;

      scoreByLeader.set(signature.leaderId, (scoreByLeader.get(signature.leaderId) || 0) + times);

      let matchedPowerIds = matchedPowerIdsByLeader.get(signature.leaderId);
      if (!matchedPowerIds) {
        matchedPowerIds = new Set<string>();
        matchedPowerIdsByLeader.set(signature.leaderId, matchedPowerIds);
      }
      matchedPowerIds.add(String(powerId));

      if (signature.strongPatterns?.some((pattern) => pattern.test(normalized))) {
        strongMatchByLeader.set(signature.leaderId, true);
      }
      return;
    }
  });

  if (scoreByLeader.size === 0) {
    return { leaderId: null, confidence: 'none', matchedPowerIds: [], tie: false };
  }

  const ranked = [...scoreByLeader.entries()].sort((a, b) => b[1] - a[1]);
  const [topLeaderId, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] ?? 0;
  const tie = ranked.length > 1 && topScore === secondScore;

  if (tie) {
    return { leaderId: null, confidence: 'none', matchedPowerIds: [], tie: true };
  }

  const matchedPowerIds = [...(matchedPowerIdsByLeader.get(topLeaderId) || new Set<string>())];
  const hasStrongMatch = strongMatchByLeader.get(topLeaderId) === true;

  if (hasStrongMatch) {
    return { leaderId: topLeaderId, confidence: 'high', matchedPowerIds, tie: false };
  }

  if (topScore >= 2 && topScore > secondScore) {
    return { leaderId: topLeaderId, confidence: 'high', matchedPowerIds, tie: false };
  }

  if (topScore > secondScore) {
    return { leaderId: topLeaderId, confidence: 'medium', matchedPowerIds, tie: false };
  }

  return { leaderId: null, confidence: 'none', matchedPowerIds: [], tie: false };
}

export function resolvePlayerLeaderId(input: ResolveLeaderInput): LeaderResolutionResult {
  const rawLeaderId = parseLeaderId(input.rawLeaderId);
  const eventLeaderId = parseLeaderId(input.eventLeaderId);
  const inferred = inferLeaderIdFromPowerStats(input.leaderPowerStats);
  const inferredLeaderId = inferred.leaderId;

  let resolvedLeaderId: number | null = null;
  let source: LeaderResolutionSource = 'unknown';
  let confidence: LeaderResolutionConfidence = 'none';
  let reason = 'no-leader-data';

  if (inferredLeaderId != null && inferred.confidence === 'high') {
    resolvedLeaderId = inferredLeaderId;
    source = 'power-signature';
    confidence = 'high';
    reason = 'power-signature-strong';
  } else if (rawLeaderId != null && eventLeaderId != null && rawLeaderId === eventLeaderId) {
    resolvedLeaderId = rawLeaderId;
    source = 'raw';
    confidence = 'medium';
    reason = 'upstream-agree';
  } else if (rawLeaderId != null && eventLeaderId != null) {
    resolvedLeaderId = rawLeaderId;
    source = 'raw';
    confidence = 'low';
    reason = 'upstream-conflict-fallback-raw';
  } else if (rawLeaderId != null) {
    resolvedLeaderId = rawLeaderId;
    source = 'raw';
    confidence = 'low';
    reason = 'raw-only';
  } else if (eventLeaderId != null) {
    resolvedLeaderId = eventLeaderId;
    source = 'event';
    confidence = 'low';
    reason = 'event-only';
  }

  return {
    resolvedLeaderId,
    source,
    confidence,
    rawLeaderId,
    eventLeaderId,
    inferredLeaderId,
    mismatch: resolvedLeaderId != null && rawLeaderId != null ? resolvedLeaderId !== rawLeaderId : false,
    reason,
    matchedPowerIds: inferred.matchedPowerIds,
  };
}
