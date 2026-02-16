import type { TimelineEntry, PlayerInfo } from './types';
import { formatMatchClock, renderTechTierBadge } from './dataProcessing';
import { ensureLeaderPowerMap, getLeaderPowerDisplayName } from './apiCache';
import { getLeaderName } from '../../data/haloWars2/leaders';
import { getMatchResult } from '../../utils/haloApi';
import { fetchMatchEventsPayload, buildEventEntries } from './matchEventProcessing';

function buildEventSummarySections(entries: TimelineEntry[], playersByIndex: Map<number, PlayerInfo>) {
  const playerCounts = new Map<number, { playerIndex: number; name: string; teamId: number | null; units: number; techs: number; powers: number }>();
  const buildOrderEntries = new Map<number, { playerIndex: number; name: string; teamId: number | null; entries: TimelineEntry[] }>();
  const buildOrderKinds = new Set<TimelineEntry['kind']>(['building', 'unit', 'upgrade', 'unit_upgrade']);

  entries.forEach((entry) => {
    if (entry.playerIndex == null) return;
    const playerInfo = playersByIndex.get(entry.playerIndex);
    if (playerInfo?.playerType === 3) return;
    const name = playerInfo?.name || entry.playerName || `Player ${entry.playerIndex}`;
    const teamId = playerInfo?.teamId ?? entry.teamId ?? null;
    const row = playerCounts.get(entry.playerIndex) || {
      playerIndex: entry.playerIndex,
      name,
      teamId,
      units: 0,
      techs: 0,
      powers: 0,
    };
    if (entry.kind === 'unit') row.units += 1;
    if (entry.kind === 'unit_upgrade') row.techs += 1;
    if (entry.kind === 'power') row.powers += 1;
    playerCounts.set(entry.playerIndex, row);

    if (buildOrderKinds.has(entry.kind)) {
      const orderRow = buildOrderEntries.get(entry.playerIndex) || {
        playerIndex: entry.playerIndex,
        name,
        teamId,
        entries: [],
      };
      orderRow.entries.push(entry);
      buildOrderEntries.set(entry.playerIndex, orderRow);
    }
  });

  playersByIndex.forEach((info, index) => {
    if (info.playerType === 3) return;
    if (!playerCounts.has(index)) {
      playerCounts.set(index, {
        playerIndex: index,
        name: info.name || `Player ${index}`,
        teamId: info.teamId ?? null,
        units: 0,
        techs: 0,
        powers: 0,
      });
    }
  });

  const summaryTeams = new Map<number, { players: Array<{ playerIndex: number; name: string; units: number; techs: number; powers: number }>; totals: { units: number; techs: number; powers: number } }>();
  playerCounts.forEach((row) => {
    const teamKey = typeof row.teamId === 'number' ? row.teamId : -1;
    const team = summaryTeams.get(teamKey) || { players: [], totals: { units: 0, techs: 0, powers: 0 } };
    team.players.push({ playerIndex: row.playerIndex, name: row.name, units: row.units, techs: row.techs, powers: row.powers });
    team.totals.units += row.units;
    team.totals.techs += row.techs;
    team.totals.powers += row.powers;
    summaryTeams.set(teamKey, team);
  });

  const summaryCards = [...summaryTeams.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([teamId, team]) => {
      const headerLabel = teamId === -1 ? 'Unknown Team' : (teamId === 0 ? 'Neutral' : `Team ${teamId}`);
      const rows = team.players
        .sort((a, b) => a.playerIndex - b.playerIndex)
        .map((player) => `
          <span class="text-gray-200 truncate">${player.name}</span>
          <span class="text-xs font-mono text-sky-200 text-right">${player.units}</span>
          <span class="text-xs font-mono text-teal-200 text-right">${player.techs}</span>
          <span class="text-xs font-mono text-amber-200 text-right">${player.powers}</span>
        `).join('');
      const tableHtml = team.players.length
        ? `
          <div class="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 text-xs">
            <span class="text-[10px] uppercase tracking-wider text-gray-500">Player</span>
            <span class="text-[10px] uppercase tracking-wider text-gray-500 text-right">Units</span>
            <span class="text-[10px] uppercase tracking-wider text-gray-500 text-right">Unit Upgrades</span>
            <span class="text-[10px] uppercase tracking-wider text-gray-500 text-right">Powers</span>
            ${rows}
          </div>
        `
        : '<p class="text-xs text-gray-500">No player data.</p>';

      return `
        <div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[10px] uppercase tracking-wider text-gray-400">${headerLabel}</p>
            <span class="text-[10px] uppercase tracking-wider text-gray-500">Totals</span>
          </div>
          ${tableHtml}
          <div class="mt-3 flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-gray-500">
            <span>Units <span class="text-sky-200">${team.totals.units}</span></span>
            <span>Unit Upgrades <span class="text-teal-200">${team.totals.techs}</span></span>
            <span>Powers <span class="text-amber-200">${team.totals.powers}</span></span>
          </div>
        </div>
      `;
    });

  const buildOrderTeams = new Map<number, Array<{ playerIndex: number; name: string; entries: TimelineEntry[] }>>();
  buildOrderEntries.forEach((row) => {
    const teamKey = typeof row.teamId === 'number' ? row.teamId : -1;
    const list = buildOrderTeams.get(teamKey) || [];
    const entriesSorted = row.entries.sort((a, b) => a.timeMs - b.timeMs).slice(0, 5);
    list.push({ playerIndex: row.playerIndex, name: row.name, entries: entriesSorted });
    buildOrderTeams.set(teamKey, list);
  });

  const buildOrderCards = [...buildOrderTeams.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([teamId, players]) => {
      const headerLabel = teamId === -1 ? 'Unknown Team' : (teamId === 0 ? 'Neutral' : `Team ${teamId}`);
      const playerBlocks = players
        .sort((a, b) => a.playerIndex - b.playerIndex)
        .map((player) => {
          const items = player.entries.map((entry) => `
            <div class="grid grid-cols-[52px_minmax(0,1fr)] gap-2 text-xs">
              <span class="font-mono text-cyan-300">${formatMatchClock(entry.timeMs)}</span>
              <span class="flex flex-wrap items-center gap-2">
                <span class="text-gray-300">${entry.label}</span>
                ${renderTechTierBadge(entry)}
              </span>
            </div>
          `).join('') || '<span class="text-xs text-gray-500">No build order data</span>';
          return `
            <div class="rounded-md border border-slate-700/40 bg-slate-900/40 p-2">
              <p class="text-[10px] uppercase tracking-wider text-gray-400 mb-2">${player.name}</p>
              <div class="space-y-1">
                ${items}
              </div>
            </div>
          `;
        }).join('');

      return `
        <div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[10px] uppercase tracking-wider text-gray-400">${headerLabel}</p>
            <span class="text-[10px] uppercase tracking-wider text-gray-500">First 5</span>
          </div>
          <div class="space-y-2">
            ${playerBlocks}
          </div>
        </div>
      `;
    });

  return { summaryCards, buildOrderCards };
}

function getSummarySkeleton() {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3 animate-pulse">
        <div class="h-3 w-24 bg-slate-700/60 rounded mb-3"></div>
        <div class="space-y-2">
          <div class="h-3 bg-slate-700/50 rounded"></div>
          <div class="h-3 bg-slate-700/50 rounded w-5/6"></div>
          <div class="h-3 bg-slate-700/50 rounded w-4/6"></div>
        </div>
      </div>
      <div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3 animate-pulse">
        <div class="h-3 w-28 bg-slate-700/60 rounded mb-3"></div>
        <div class="space-y-2">
          <div class="h-3 bg-slate-700/50 rounded"></div>
          <div class="h-3 bg-slate-700/50 rounded w-5/6"></div>
          <div class="h-3 bg-slate-700/50 rounded w-4/6"></div>
        </div>
      </div>
    </div>
    <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3 animate-pulse">
        <div class="h-3 w-32 bg-slate-700/60 rounded mb-3"></div>
        <div class="space-y-2">
          <div class="h-3 bg-slate-700/50 rounded"></div>
          <div class="h-3 bg-slate-700/50 rounded w-5/6"></div>
          <div class="h-3 bg-slate-700/50 rounded w-4/6"></div>
        </div>
      </div>
      <div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3 animate-pulse">
        <div class="h-3 w-28 bg-slate-700/60 rounded mb-3"></div>
        <div class="space-y-2">
          <div class="h-3 bg-slate-700/50 rounded"></div>
          <div class="h-3 bg-slate-700/50 rounded w-5/6"></div>
          <div class="h-3 bg-slate-700/50 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  `;
}

async function loadMatchSummary(matchId: string, summaryContentEl: HTMLElement, options: { reveal?: boolean } = {}) {
  if (summaryContentEl.getAttribute('data-loading') === 'true') return;
  summaryContentEl.setAttribute('data-loading', 'true');
  if (options.reveal) {
    summaryContentEl.classList.remove('hidden');
  }
  summaryContentEl.innerHTML = getSummarySkeleton();

  const eventResult = await fetchMatchEventsPayload(matchId);
  if (!eventResult.ok) {
    summaryContentEl.removeAttribute('data-loading');
    summaryContentEl.innerHTML = `
      <div class="rounded-lg border border-slate-700/40 bg-slate-900/40 p-3 text-sm text-gray-400">
        Match summary unavailable.
        <button type="button" class="match-summary-retry ml-2 text-xs text-cyan-300 hover:text-cyan-200 underline" data-match-id="${matchId}">Retry</button>
      </div>
    `;
    const retryBtn = summaryContentEl.querySelector('.match-summary-retry') as HTMLButtonElement | null;
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        summaryContentEl.setAttribute('data-loaded', 'false');
        loadMatchSummary(matchId, summaryContentEl, { reveal: true });
      });
    }
    return;
  }

  const { entries, playersByIndex, isCompleteSet } = await buildEventEntries(eventResult.data);
  if (entries.length === 0) {
    summaryContentEl.removeAttribute('data-loading');
    summaryContentEl.innerHTML = `
      <div class="rounded-lg border border-slate-700/40 bg-slate-900/40 p-3 text-sm text-gray-400">
        No event data available for this match.
        <button type="button" class="match-summary-retry ml-2 text-xs text-cyan-300 hover:text-cyan-200 underline" data-match-id="${matchId}">Retry</button>
      </div>
    `;
    const retryBtn = summaryContentEl.querySelector('.match-summary-retry') as HTMLButtonElement | null;
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        summaryContentEl.setAttribute('data-loaded', 'false');
        loadMatchSummary(matchId, summaryContentEl, { reveal: true });
      });
    }
    return;
  }

  const { summaryCards, buildOrderCards } = buildEventSummarySections(entries, playersByIndex);
  const completionTag = isCompleteSet === false
    ? '<span class="text-amber-300">Event feed incomplete</span>'
    : '<span class="text-emerald-300">Event feed complete</span>';
  summaryContentEl.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-gray-500 mb-2">
      <span>Match Summary</span>
      ${completionTag}
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      ${summaryCards.join('')}
    </div>
    <div class="mt-4">
      <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-gray-500 mb-2">
        <span>Build Order Highlights</span>
        <span class="text-[10px] uppercase tracking-wider text-gray-500">First 5</span>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${buildOrderCards.join('')}
      </div>
    </div>
  `;
  summaryContentEl.removeAttribute('data-loading');
  summaryContentEl.setAttribute('data-loaded', 'true');
}

export async function loadMatchDetails(matchId: string, detailsEl: HTMLElement) {
  if (detailsEl.getAttribute('data-loading') === 'true') return;
  detailsEl.setAttribute('data-loading', 'true');
  detailsEl.innerHTML = 'Loading team compositions...';

  const result = await getMatchResult(matchId);
  detailsEl.removeAttribute('data-loading');

  if (!result.ok) {
    const message = result.error?.message || 'Unable to load team compositions.';
    detailsEl.innerHTML = `
      <div class="flex items-center gap-3 text-red-300">
        <span>${message}</span>
        <button type="button" class="match-details-retry text-xs text-cyan-300 hover:text-cyan-200 underline" data-match-id="${matchId}">Retry</button>
      </div>
    `;
    const retryBtn = detailsEl.querySelector('.match-details-retry') as HTMLButtonElement | null;
    if (retryBtn) {
      retryBtn.addEventListener('click', () => loadMatchDetails(matchId, detailsEl));
    }
    return;
  }

  const playersRaw = result.data?.Players;
  const players = Array.isArray(playersRaw)
    ? playersRaw
    : (playersRaw && typeof playersRaw === 'object')
      ? Object.values(playersRaw)
      : [];

  const getPlayerDisplayName = (player: any): string => {
    return player?.HumanPlayerId?.Gamertag
      || player?.Gamertag
      || (player?.HumanPlayerId && typeof player.HumanPlayerId === 'string' ? player.HumanPlayerId : '')
      || (player?.IsHuman === false ? 'AI' : '')
      || (player?.ComputerPlayerId != null ? `AI ${player.ComputerPlayerId}` : '')
      || 'Unknown';
  };

  const leaderPowerMap = await ensureLeaderPowerMap();
  const teamMap = new Map<number, { members: Array<{ name: string; leader: string; destroyed: number; lost: number; powerEntries: Array<{ name: string; times: number }> }>; totals: { destroyed: number; lost: number; powers: number } }>();
  players.forEach((p: any) => {
    if (p.PlayerType === 3) return;
    const teamId = p.TeamId;
    const leaderId = p.LeaderId;
    if (teamId == null || leaderId == null) return;
    const gamertag = getPlayerDisplayName(p);
    const leaderName = getLeaderName(leaderId);
    let destroyed = 0;
    let lost = 0;
    const unitStats = p?.UnitStats;
    if (unitStats && typeof unitStats === 'object') {
      Object.values(unitStats).forEach((u: any) => {
        destroyed += u?.TotalDestroyed || 0;
        lost += u?.TotalLost || 0;
      });
    }
    const powerEntries: Array<{ name: string; times: number }> = [];
    let powerCount = 0;
    const leaderPowerStats = p?.LeaderPowerStats;
    if (leaderPowerStats && typeof leaderPowerStats === 'object') {
      const entries = Object.entries(leaderPowerStats)
        .map(([powerId, stats]) => {
          const times = typeof stats === 'number'
            ? stats
            : (stats as any)?.TimesCast ?? (stats as any)?.TotalPlays ?? 0;
          return { powerId, times };
        })
        .filter((pwr) => pwr.times > 0)
        .sort((a, b) => b.times - a.times);
      entries.forEach((pwr) => {
        powerEntries.push({ name: getLeaderPowerDisplayName(pwr.powerId, leaderPowerMap), times: pwr.times });
        powerCount += pwr.times;
      });
    }
    const team = teamMap.get(teamId) || { members: [], totals: { destroyed: 0, lost: 0, powers: 0 } };
    team.members.push({ name: gamertag, leader: leaderName, destroyed, lost, powerEntries });
    team.totals.destroyed += destroyed;
    team.totals.lost += lost;
    team.totals.powers += powerCount;
    teamMap.set(teamId, team);
  });

  if (teamMap.size === 0) {
    detailsEl.innerHTML = 'Team composition data not available.';
    return;
  }

  const teamCards = [...teamMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([teamId, team]) => {
      const rows = team.members.map((m) => `
        <span class="text-gray-200 truncate">${m.name}</span>
        <span class="text-cyan-300 truncate">${m.leader}</span>
        <span class="text-xs text-gray-400 text-right">${m.destroyed} / ${m.lost}</span>
      `).join('');
      const powerRows = team.members.map((m) => {
        const powerText = m.powerEntries.length
          ? m.powerEntries.map((pwr) => `${pwr.name} x${pwr.times}`).join(', ')
          : '-';
        return `
          <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 text-xs">
            <span class="text-gray-300 truncate">${m.name}</span>
            <span class="text-gray-400">${powerText}</span>
          </div>
        `;
      }).join('');
      return `
        <div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
          <p class="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Team ${teamId}</p>
          <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 text-xs">
            <span class="text-[10px] uppercase tracking-wider text-gray-500">Player</span>
            <span class="text-[10px] uppercase tracking-wider text-gray-500">Leader</span>
            <span class="text-[10px] uppercase tracking-wider text-gray-500 text-right">Units Destroyed / Units Lost</span>
            ${rows}
          </div>
          <div class="mt-3 border-t border-slate-700/40 pt-3">
            <p class="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Leader Powers by Player</p>
            <div class="space-y-2">
              ${powerRows}
            </div>
          </div>
          <div class="mt-3 border-t border-slate-700/40 pt-3 flex flex-wrap gap-4 text-[10px] uppercase tracking-wider text-gray-500">
            <span>Units Destroyed: <span class="text-gray-300">${team.totals.destroyed}</span></span>
            <span>Units Lost: <span class="text-gray-300">${team.totals.lost}</span></span>
            <span>Leader Powers Used: <span class="text-gray-300">${team.totals.powers}</span></span>
          </div>
        </div>
      `;
    });

  // Tech timing section
  let techTimingSection = `
    <div class="mt-4 rounded-lg border border-slate-700/40 bg-slate-900/40 p-3">
      <p class="text-[11px] uppercase tracking-wider text-gray-400">Tech Timing by Player</p>
      <p class="text-xs text-gray-500 mt-1">Unable to load event data for tech timing.</p>
    </div>
  `;
  const techTimingsResult = await fetchMatchEventsPayload(matchId);
  if (techTimingsResult.ok) {
    const { entries: eventEntries, playersByIndex, isCompleteSet } = await buildEventEntries(techTimingsResult.data);
    const firstTechByIndex = new Map<number, { tech2Ms: number | null; tech3Ms: number | null }>();
    const firstTechByName = new Map<string, { tech2Ms: number | null; tech3Ms: number | null }>();
    const ensureIndexTiming = (playerIndex: number) => {
      const existing = firstTechByIndex.get(playerIndex);
      if (existing) return existing;
      const created = { tech2Ms: null as number | null, tech3Ms: null as number | null };
      firstTechByIndex.set(playerIndex, created);
      return created;
    };
    const ensureNameTiming = (name: string) => {
      const key = name.trim().toLowerCase();
      const existing = firstTechByName.get(key);
      if (existing) return existing;
      const created = { tech2Ms: null as number | null, tech3Ms: null as number | null };
      firstTechByName.set(key, created);
      return created;
    };
    const techEntries = eventEntries
      .filter((entry) => entry.kind === 'upgrade' && (entry.techTier === 2 || entry.techTier === 3))
      .sort((a, b) => a.timeMs - b.timeMs);
    techEntries.forEach((entry) => {
      const tier = entry.techTier;
      if (tier !== 2 && tier !== 3) return;
      if (typeof entry.playerIndex === 'number') {
        const timing = ensureIndexTiming(entry.playerIndex);
        if (tier === 2 && timing.tech2Ms == null) timing.tech2Ms = entry.timeMs;
        if (tier === 3 && timing.tech3Ms == null) timing.tech3Ms = entry.timeMs;
      }
      const playerName = entry.playerName?.trim();
      if (playerName && playerName.toLowerCase() !== 'unknown' && !/^player\s+\d+$/i.test(playerName)) {
        const timingByName = ensureNameTiming(playerName);
        if (tier === 2 && timingByName.tech2Ms == null) timingByName.tech2Ms = entry.timeMs;
        if (tier === 3 && timingByName.tech3Ms == null) timingByName.tech3Ms = entry.timeMs;
      }
    });

    const normalizeTechPlayerName = (value: string) => value.trim().toLowerCase();
    const techRowsMap = new Map<string, { playerIndex: number | null; name: string; teamId: number | null; indexTrusted: boolean }>();

    players.forEach((player: any) => {
      if (player?.PlayerType === 3) return;
      const playerIndex = typeof player?.PlayerIndex === 'number' ? player.PlayerIndex : null;
      const name = getPlayerDisplayName(player);
      const teamId = typeof player?.TeamId === 'number' ? player.TeamId : null;
      if (playerIndex != null) {
        techRowsMap.set(`idx:${playerIndex}`, { playerIndex, name, teamId, indexTrusted: true });
        return;
      }
      const normalizedName = normalizeTechPlayerName(name);
      const key = normalizedName ? `name:${normalizedName}` : `anon:${techRowsMap.size}`;
      const existing = techRowsMap.get(key);
      if (existing) {
        if (existing.name === 'Unknown' && name !== 'Unknown') existing.name = name;
        if (existing.teamId == null && teamId != null) existing.teamId = teamId;
        return;
      }
      techRowsMap.set(key, { playerIndex: null, name, teamId, indexTrusted: false });
    });

    playersByIndex.forEach((info, index) => {
      if (info.playerType === 3) return;
      const indexKey = `idx:${index}`;
      const existing = techRowsMap.get(indexKey);
      if (existing) {
        if (existing.name === 'Unknown' && info.name) existing.name = info.name;
        if (existing.teamId == null && info.teamId != null) existing.teamId = info.teamId;
        existing.playerIndex = index;
        existing.indexTrusted = true;
        return;
      }
      techRowsMap.set(indexKey, {
        playerIndex: index,
        name: info.name || `Player ${index}`,
        teamId: info.teamId ?? null,
        indexTrusted: true,
      });
    });

    // Drop duplicate name-only rows when we also have an index-backed row for the same player.
    [...techRowsMap.entries()]
      .filter(([key]) => key.startsWith('name:'))
      .forEach(([key, row]) => {
        const normalizedName = normalizeTechPlayerName(row.name);
        if (!normalizedName) return;
        const hasIndexed = [...techRowsMap.entries()].some(([otherKey, otherRow]) => {
          if (!otherKey.startsWith('idx:')) return false;
          return normalizeTechPlayerName(otherRow.name) === normalizedName;
        });
        if (!hasIndexed) return;
        techRowsMap.delete(key);
      });

    const resolveTiming = (row: { playerIndex: number | null; name: string; indexTrusted: boolean }) => {
      if (row.indexTrusted && typeof row.playerIndex === 'number') {
        const byIndex = firstTechByIndex.get(row.playerIndex);
        if (byIndex) return byIndex;
      }
      const byName = firstTechByName.get(normalizeTechPlayerName(row.name));
      return byName || { tech2Ms: null, tech3Ms: null };
    };

    const techRowsData = [...techRowsMap.values()]
      .map((row) => {
        const timing = resolveTiming(row);
        return {
          ...row,
          tech2Ms: timing.tech2Ms,
          tech3Ms: timing.tech3Ms,
        };
      })
      .sort((a, b) => {
        const teamA = typeof a.teamId === 'number' ? a.teamId : 99;
        const teamB = typeof b.teamId === 'number' ? b.teamId : 99;
        if (teamA !== teamB) return teamA - teamB;
        if (typeof a.playerIndex === 'number' && typeof b.playerIndex === 'number' && a.playerIndex !== b.playerIndex) {
          return a.playerIndex - b.playerIndex;
        }
        if (typeof a.playerIndex === 'number' && typeof b.playerIndex !== 'number') return -1;
        if (typeof b.playerIndex === 'number' && typeof a.playerIndex !== 'number') return 1;
        return a.name.localeCompare(b.name);
      });

    const allTech2Ms = techRowsData.length > 0 && techRowsData.every((row) => row.tech2Ms != null)
      ? Math.max(...techRowsData.map((row) => row.tech2Ms as number))
      : null;
    const allTech3Ms = techRowsData.length > 0 && techRowsData.every((row) => row.tech3Ms != null)
      ? Math.max(...techRowsData.map((row) => row.tech3Ms as number))
      : null;
    const completionTag = isCompleteSet === false
      ? '<span class="text-[10px] uppercase tracking-wider text-amber-300">Event feed incomplete</span>'
      : '<span class="text-[10px] uppercase tracking-wider text-emerald-300">Event feed complete</span>';
    const rowsHtml = techRowsData.map((row) => {
      const teamLabel = typeof row.teamId === 'number' ? `Team ${row.teamId}` : 'Team ?';
      const tech2Label = row.tech2Ms != null ? formatMatchClock(row.tech2Ms) : '-';
      const tech3Label = row.tech3Ms != null ? formatMatchClock(row.tech3Ms) : '-';
      return `
        <tr class="border-t border-slate-700/40">
          <td class="py-2 pr-4 text-gray-400">${teamLabel}</td>
          <td class="py-2 pr-4 text-gray-200">${row.name}</td>
          <td class="py-2 pr-4 font-mono text-cyan-200">${tech2Label}</td>
          <td class="py-2 font-mono text-fuchsia-200">${tech3Label}</td>
        </tr>
      `;
    }).join('');

    techTimingSection = `
      <div class="mt-4 rounded-lg border border-slate-700/40 bg-slate-900/40 p-3">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p class="text-[11px] uppercase tracking-wider text-gray-400">Tech Timing by Player</p>
          ${completionTag}
        </div>
        ${techRowsData.length > 0 ? `
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-[10px] uppercase tracking-wider text-gray-500">
                  <th class="text-left font-normal pb-2 pr-4">Team</th>
                  <th class="text-left font-normal pb-2 pr-4">Player</th>
                  <th class="text-left font-normal pb-2 pr-4">Tech 2</th>
                  <th class="text-left font-normal pb-2">Tech 3</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
          <div class="mt-3 flex flex-wrap gap-4 text-[10px] uppercase tracking-wider text-gray-500">
            <span>All Players Tech 2: <span class="text-gray-300">${allTech2Ms != null ? formatMatchClock(allTech2Ms) : '-'}</span></span>
            <span>All Players Tech 3: <span class="text-gray-300">${allTech3Ms != null ? formatMatchClock(allTech3Ms) : '-'}</span></span>
          </div>
        ` : '<p class="text-xs text-gray-500">No Tech 2/Tech 3 timing data available.</p>'}
      </div>
    `;
  }

  detailsEl.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${teamCards.join('')}</div>
    ${techTimingSection}
    <div class="mt-4 rounded-lg border border-slate-700/40 bg-slate-900/40 p-3">
      <div>
        <p class="text-[11px] uppercase tracking-wider text-gray-400">Match Summary + Build Order</p>
        <p class="text-xs text-gray-500">Loads with event data for this match.</p>
      </div>
      <div id="match-summary-${matchId}" class="match-summary-content mt-3" data-loaded="false"></div>
    </div>
  `;

  const summaryContent = detailsEl.querySelector('.match-summary-content') as HTMLElement | null;
  if (summaryContent && summaryContent.getAttribute('data-loaded') !== 'true') {
    loadMatchSummary(matchId, summaryContent, { reveal: true });
  }
  detailsEl.setAttribute('data-loaded', 'true');
}
