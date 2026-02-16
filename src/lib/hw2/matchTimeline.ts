import type { TimelineEntry, PlayerInfo } from './types';
import { state } from './state';
import { formatMatchClock, renderTechTierBadge } from './dataProcessing';
import { getLeaderName } from '../../data/haloWars2/leaders';
import { getMatchEvents, getMatchResult } from '../../utils/haloApi';
import { buildEventEntries } from './matchEventProcessing';

function buildTimelineHighlights(entries: TimelineEntry[]) {
  if (entries.length === 0) return '';
  const order: Array<{ kind: TimelineEntry['kind']; title: string }> = [
    { kind: 'building', title: 'First building complete' },
    { kind: 'upgrade', title: 'First building upgrade' },
    { kind: 'unit', title: 'First unit trained' },
    { kind: 'unit_upgrade', title: 'First tech researched' },
    { kind: 'power', title: 'First leader power' },
    { kind: 'veterancy', title: 'First veterancy' },
  ];
  const tagMap: Record<TimelineEntry['kind'], { className: string; label: string }> = {
    building: { className: 'border-emerald-400/40 text-emerald-200 bg-emerald-400/10', label: 'Building' },
    upgrade: { className: 'border-orange-400/40 text-orange-200 bg-orange-400/10', label: 'Upgrade' },
    unit: { className: 'border-sky-400/40 text-sky-200 bg-sky-400/10', label: 'Unit' },
    unit_upgrade: { className: 'border-teal-400/40 text-teal-200 bg-teal-400/10', label: 'Tech' },
    power: { className: 'border-amber-400/40 text-amber-200 bg-amber-400/10', label: 'Power' },
    veterancy: { className: 'border-rose-400/40 text-rose-200 bg-rose-400/10', label: 'Veterancy' },
  };
  const sorted = [...entries].sort((a, b) => a.timeMs - b.timeMs);
  const firstByKind = new Map<TimelineEntry['kind'], TimelineEntry>();
  sorted.forEach((entry) => {
    if (!firstByKind.has(entry.kind)) {
      firstByKind.set(entry.kind, entry);
    }
  });

  const highlightRows = order.map((item) => {
    const entry = firstByKind.get(item.kind);
    if (!entry) return '';
    const tag = tagMap[item.kind];
    const timeLabel = formatMatchClock(entry.timeMs);
    return `
      <div class="rounded-md border border-slate-700/40 bg-slate-900/40 p-2">
        <div class="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500 mb-1">
          <span>${item.title}</span>
          <span class="font-mono text-cyan-300">${timeLabel}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="text-gray-200 truncate">${entry.playerName}</span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider ${tag.className}">${tag.label}</span>
          <span class="text-gray-400">${entry.label}</span>
          ${renderTechTierBadge(entry)}
        </div>
      </div>
    `;
  }).filter(Boolean).join('');

  const techMilestoneRows = ([2, 3] as const).map((tier) => {
    const entry = sorted.find((e) => e.kind === 'upgrade' && e.techTier === tier);
    if (!entry) return '';
    const timeLabel = formatMatchClock(entry.timeMs);
    return `
      <div class="rounded-md border border-slate-700/40 bg-slate-900/40 p-2">
        <div class="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500 mb-1">
          <span>First Tech ${tier}</span>
          <span class="font-mono text-cyan-300">${timeLabel}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="text-gray-200 truncate">${entry.playerName}</span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider border-orange-400/40 text-orange-200 bg-orange-400/10">Upgrade</span>
          <span class="text-gray-400">${entry.label}</span>
          ${renderTechTierBadge(entry)}
        </div>
      </div>
    `;
  }).filter(Boolean).join('');

  const combinedRows = [highlightRows, techMilestoneRows].filter(Boolean).join('');
  if (!combinedRows) return '';

  return `
    <div class="rounded-lg border border-slate-700/40 bg-slate-800/30 p-3 mb-3">
      <div class="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500 mb-2">
        <span>Timeline highlights</span>
        <span class="text-[10px] text-gray-600">Firsts</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        ${combinedRows}
      </div>
    </div>
  `;
}

export async function loadMatchTimeline(matchId: string, timelineEl: HTMLElement) {
  if (timelineEl.getAttribute('data-loading') === 'true') return;
  timelineEl.setAttribute('data-loading', 'true');
  timelineEl.innerHTML = 'Loading build timeline...';

  let payload = state.matchEventsCache.get(matchId);
  if (!payload) {
    const result = await getMatchEvents(matchId);
    if (!result.ok) {
      const message = result.error?.message || 'Unable to load match events.';
      timelineEl.removeAttribute('data-loading');
      timelineEl.innerHTML = `
        <div class="flex items-center gap-3 text-red-300">
          <span>${message}</span>
          <button type="button" class="match-timeline-retry text-xs text-cyan-300 hover:text-cyan-200 underline" data-match-id="${matchId}">Retry</button>
        </div>
      `;
      const retryBtn = timelineEl.querySelector('.match-timeline-retry') as HTMLButtonElement | null;
      if (retryBtn) {
        retryBtn.addEventListener('click', () => loadMatchTimeline(matchId, timelineEl));
      }
      return;
    }
    payload = result.data;
    state.matchEventsCache.set(matchId, payload);
  }

  const { entries: rawEntries, playersByIndex, isCompleteSet } = await buildEventEntries(payload);
  const entries = rawEntries.filter((entry) => {
    if (entry.playerIndex == null) return true;
    const info = playersByIndex.get(entry.playerIndex);
    return info?.playerType !== 3;
  });
  if (entries.length === 0) {
    timelineEl.removeAttribute('data-loading');
    timelineEl.innerHTML = `
      <div class="text-sm text-gray-400">
        No event data available for this match.
        <button type="button" class="match-timeline-retry ml-2 text-xs text-cyan-300 hover:text-cyan-200 underline" data-match-id="${matchId}">Retry</button>
      </div>
    `;
    const retryBtn = timelineEl.querySelector('.match-timeline-retry') as HTMLButtonElement | null;
    if (retryBtn) {
      retryBtn.addEventListener('click', () => loadMatchTimeline(matchId, timelineEl));
    }
    timelineEl.setAttribute('data-loaded', 'true');
    return;
  }

  const completionTag = isCompleteSet === false
    ? '<span class="text-amber-300">Event feed incomplete</span>'
    : '<span class="text-emerald-300">Event feed complete</span>';

  const maxTimeMs = entries.reduce((max, entry) => Math.max(max, entry.timeMs), 0);
  const maxMinutes = Math.max(1, Math.ceil(maxTimeMs / 60000));
  const playerOptions = [...playersByIndex.entries()]
    .filter(([, info]) => info.playerType !== 3)
    .sort((a, b) => a[0] - b[0])
    .map(([index, info]) => {
      const teamLabel = typeof info.teamId === 'number' ? `Team ${info.teamId}` : 'Team ?';
      return `<option value="${index}">${info.name} (${teamLabel})</option>`;
    })
    .join('');
  const highlightsHtml = buildTimelineHighlights(entries);
  const match = state.matchLookup.get(matchId) || state.currentMatches.find((m: any) => m.MatchId === matchId);
  const normalizeRosterKey = (value: string) => value.trim().toLowerCase();
  const getMatchPlayersArray = (raw: any) => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return Object.values(raw);
    return [];
  };
  const getMatchPlayerName = (player: any) => {
    const humanId = player?.HumanPlayerId;
    if (typeof humanId === 'string') return humanId;
    if (typeof humanId === 'object' && humanId?.Gamertag) return String(humanId.Gamertag);
    return player?.Gamertag || player?.PlayerId || player?.Xuid || '';
  };
  const matchPlayers = await (async () => {
    const basePlayers = getMatchPlayersArray(match?.Players);
    const hasLeaders = basePlayers.some((p: any) => p?.LeaderId != null);
    if (hasLeaders) return basePlayers;
    const cached = state.matchResultCache.get(matchId);
    if (cached) return getMatchPlayersArray(cached?.Players);
    const result = await getMatchResult(matchId);
    if (result.ok && result.data) {
      state.matchResultCache.set(matchId, result.data);
      return getMatchPlayersArray(result.data?.Players);
    }
    return basePlayers;
  })();
  const matchLeaderByIndex = new Map<number, number>();
  const matchLeaderByName = new Map<string, number>();
  matchPlayers.forEach((player: any) => {
    const leaderId = player?.LeaderId;
    if (leaderId == null) return;
    if (typeof player?.PlayerIndex === 'number') {
      matchLeaderByIndex.set(player.PlayerIndex, leaderId);
    }
    const nameKey = normalizeRosterKey(getMatchPlayerName(player));
    if (nameKey) matchLeaderByName.set(nameKey, leaderId);
  });
  const resolveLeaderIdForPlayer = (index: number, info: PlayerInfo) => {
    if (typeof info.leaderId === 'number') return info.leaderId;
    const byIndex = matchLeaderByIndex.get(index);
    if (byIndex != null) return byIndex;
    const nameKey = normalizeRosterKey(info.name || '');
    if (!nameKey) return null;
    return matchLeaderByName.get(nameKey) ?? null;
  };
  const getTeamSwatchClass = (teamId: number | null) => {
    if (typeof teamId !== 'number') return 'bg-slate-500';
    if (teamId === 1) return 'bg-sky-400';
    if (teamId === 2) return 'bg-red-400';
    return 'bg-sky-400';
  };
  const rosterEntries = [...playersByIndex.entries()]
    .filter(([, info]) => info.playerType !== 3)
    .sort((a, b) => a[0] - b[0])
    .map(([index, info]) => {
      const leaderId = resolveLeaderIdForPlayer(index, info);
      const leaderName = leaderId != null ? getLeaderName(leaderId) : 'Unknown';
      const teamLabel = typeof info.teamId === 'number' ? `Team ${info.teamId}` : '';
      return {
        index,
        name: info.name || `Player ${index}`,
        leaderName,
        teamLabel,
        swatchClass: getTeamSwatchClass(info.teamId ?? null),
        teamId: info.teamId ?? null,
      };
    });
  const team1Entries = rosterEntries.filter((entry) => entry.teamId === 1);
  const team2Entries = rosterEntries.filter((entry) => entry.teamId === 2);
  const otherEntries = rosterEntries.filter((entry) => entry.teamId !== 1 && entry.teamId !== 2);
  const rosterHtml = rosterEntries.length > 0
    ? `
      <div class="match-timeline-roster sticky top-3 z-20 mb-3 rounded-lg border border-slate-700/40 bg-slate-900/80 px-3 py-2 backdrop-blur">
        <div class="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500 mb-2">
          <span>Roster</span>
          <span class="text-[10px] text-gray-600">Leaders</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div class="flex flex-wrap gap-2">
            ${team1Entries.map((entry) => `
              <div class="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/70 px-3 py-1 text-[11px] text-gray-200">
                <span class="inline-flex h-2 w-2 rounded-full ${entry.swatchClass}"></span>
                <span class="font-semibold text-gray-100">${entry.name}</span>
                <span class="text-gray-500">&bull;</span>
                <span class="text-cyan-200">${entry.leaderName}</span>
              </div>
            `).join('')}
          </div>
          <div class="flex flex-wrap justify-start md:justify-end gap-2">
            ${team2Entries.map((entry) => `
              <div class="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/70 px-3 py-1 text-[11px] text-gray-200">
                <span class="inline-flex h-2 w-2 rounded-full ${entry.swatchClass}"></span>
                <span class="font-semibold text-gray-100">${entry.name}</span>
                <span class="text-gray-500">&bull;</span>
                <span class="text-cyan-200">${entry.leaderName}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ${otherEntries.length > 0 ? `
          <div class="mt-2 flex flex-wrap gap-2">
            ${otherEntries.map((entry) => `
              <div class="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/70 px-3 py-1 text-[11px] text-gray-200">
                <span class="inline-flex h-2 w-2 rounded-full ${entry.swatchClass}"></span>
                <span class="font-semibold text-gray-100">${entry.name}</span>
                <span class="text-gray-500">&bull;</span>
                <span class="text-cyan-200">${entry.leaderName}</span>
                ${entry.teamLabel ? `<span class="text-[10px] text-gray-500">${entry.teamLabel}</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `
    : '';

  timelineEl.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-gray-500 mb-3">
      <span>Build timeline by team</span>
      <span class="flex items-center gap-3">
        <span data-timeline-count="${matchId}">0 events</span>
        ${completionTag}
      </span>
    </div>
    ${highlightsHtml}
    ${rosterHtml}
    <div class="rounded-lg border border-slate-700/40 bg-slate-800/30 p-3 mb-3">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <label class="flex flex-col gap-1">
          <span class="text-[10px] uppercase tracking-wider text-gray-400">Player</span>
          <select class="timeline-player-filter w-full rounded-md border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-gray-200">
            <option value="all">All players</option>
            ${playerOptions}
          </select>
        </label>
        <div>
          <span class="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Event types</span>
          <div class="flex flex-wrap gap-2">
            <label class="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">
              <input type="checkbox" name="timeline-type" value="building" checked class="accent-emerald-400" />
              <span class="text-[10px] uppercase tracking-wider text-emerald-200">Buildings</span>
            </label>
            <label class="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1">
              <input type="checkbox" name="timeline-type" value="upgrade" checked class="accent-orange-400" />
              <span class="text-[10px] uppercase tracking-wider text-orange-200">Building Upgrades</span>
            </label>
            <label class="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1">
              <input type="checkbox" name="timeline-type" value="unit" checked class="accent-sky-400" />
              <span class="text-[10px] uppercase tracking-wider text-sky-200">Units</span>
            </label>
            <label class="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1">
              <input type="checkbox" name="timeline-type" value="unit_upgrade" checked class="accent-teal-400" />
              <span class="text-[10px] uppercase tracking-wider text-teal-200">Unit Upgrades</span>
            </label>
            <label class="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1">
              <input type="checkbox" name="timeline-type" value="veterancy" checked class="accent-rose-400" />
              <span class="text-[10px] uppercase tracking-wider text-rose-200">Veterancy</span>
            </label>
            <label class="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1">
              <input type="checkbox" name="timeline-type" value="power" checked class="accent-amber-400" />
              <span class="text-[10px] uppercase tracking-wider text-amber-200">Powers</span>
            </label>
          </div>
        </div>
        <label class="flex flex-col gap-1">
          <span class="text-[10px] uppercase tracking-wider text-gray-400">Start (min)</span>
          <input type="number" min="0" max="${maxMinutes}" step="1" value="0" class="timeline-start w-full rounded-md border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-gray-200" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[10px] uppercase tracking-wider text-gray-400">End (min)</span>
          <input type="number" min="0" max="${maxMinutes}" step="1" value="${maxMinutes}" class="timeline-end w-full rounded-md border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-gray-200" />
          <span class="text-[10px] text-gray-500">Max ${formatMatchClock(maxTimeMs)}</span>
        </label>
      </div>
    </div>
    <div class="match-timeline-list grid grid-cols-1 lg:grid-cols-2 gap-4"></div>
  `;

  const listEl = timelineEl.querySelector('.match-timeline-list') as HTMLElement | null;
  const playerFilter = timelineEl.querySelector('.timeline-player-filter') as HTMLSelectElement | null;
  const typeInputs = Array.from(timelineEl.querySelectorAll('input[name="timeline-type"]')) as HTMLInputElement[];
  const startInput = timelineEl.querySelector('.timeline-start') as HTMLInputElement | null;
  const endInput = timelineEl.querySelector('.timeline-end') as HTMLInputElement | null;
  const countEl = timelineEl.querySelector(`[data-timeline-count="${matchId}"]`) as HTMLElement | null;

  const filterState = {
    player: 'all',
    types: new Set(['building', 'upgrade', 'unit', 'unit_upgrade', 'power', 'veterancy']),
    startMin: 0,
    endMin: maxMinutes,
  };

  const resolveTag = (kind: TimelineEntry['kind']) => {
    switch (kind) {
      case 'building':
        return { className: 'border-emerald-400/40 text-emerald-200 bg-emerald-400/10', label: 'Building' };
      case 'upgrade':
        return { className: 'border-orange-400/40 text-orange-200 bg-orange-400/10', label: 'Building Upgrade' };
      case 'unit':
        return { className: 'border-sky-400/40 text-sky-200 bg-sky-400/10', label: 'Unit' };
      case 'unit_upgrade':
        return { className: 'border-teal-400/40 text-teal-200 bg-teal-400/10', label: 'Unit Upgrade' };
      case 'veterancy':
        return { className: 'border-rose-400/40 text-rose-200 bg-rose-400/10', label: 'Veterancy' };
      default:
        return { className: 'border-amber-400/40 text-amber-200 bg-amber-400/10', label: 'Power' };
    }
  };

  const renderTimelineList = () => {
    if (!listEl) return;
    const startMs = Math.max(0, filterState.startMin) * 60000;
    const endMs = Math.max(0, filterState.endMin) * 60000;
    const filtered = entries.filter((entry) => {
      if (filterState.player !== 'all' && String(entry.playerIndex) !== filterState.player) return false;
      if (!filterState.types.has(entry.kind)) return false;
      if (entry.timeMs < startMs || entry.timeMs > endMs) return false;
      return true;
    });

    if (countEl) {
      countEl.textContent = `${filtered.length} events`;
    }

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="text-sm text-gray-400">No events in this filter window.</div>';
      return;
    }

    const teamGroups = new Map<number, TimelineEntry[]>();
    const unassigned: TimelineEntry[] = [];

    filtered.forEach((entry) => {
      if (typeof entry.teamId === 'number') {
        const group = teamGroups.get(entry.teamId) || [];
        group.push(entry);
        teamGroups.set(entry.teamId, group);
      } else {
        unassigned.push(entry);
      }
    });

    teamGroups.forEach((group) => group.sort((a, b) => a.timeMs - b.timeMs));
    unassigned.sort((a, b) => a.timeMs - b.timeMs);

    const teamCards = [...teamGroups.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([teamId, group]) => {
        const headerLabel = teamId === 0 ? 'Neutral' : `Team ${teamId}`;
        const counts = { building: 0, unit: 0, power: 0 };
        group.forEach((entry) => {
          if (entry.kind === 'building') counts.building += 1;
          if (entry.kind === 'unit') counts.unit += 1;
          if (entry.kind === 'power') counts.power += 1;
        });
        const rows = group.map((entry) => {
          const timeLabel = formatMatchClock(entry.timeMs);
          const tag = resolveTag(entry.kind);
          return `
            <div class="grid grid-cols-[72px_minmax(0,1fr)] gap-3 items-start text-xs">
              <span class="font-mono text-cyan-300">${timeLabel}</span>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-gray-200 truncate">${entry.playerName}</span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider ${tag.className}">${tag.label}</span>
                  <span class="text-gray-300">${entry.label}</span>
                  ${renderTechTierBadge(entry)}
                </div>
                ${entry.detail ? `<div class="text-[10px] text-gray-500 mt-1">${entry.detail}</div>` : ''}
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[10px] uppercase tracking-wider text-gray-400">${headerLabel}</p>
              <span class="text-[10px] uppercase tracking-wider text-gray-500">${group.length} events</span>
            </div>
            <div class="flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-gray-500 mb-3">
              <span>Buildings <span class="text-emerald-200">${counts.building}</span></span>
              <span>Units <span class="text-sky-200">${counts.unit}</span></span>
              <span>Powers <span class="text-amber-200">${counts.power}</span></span>
            </div>
            <div class="space-y-3">
              ${rows}
            </div>
          </div>
        `;
      });

    if (unassigned.length > 0) {
      const counts = { building: 0, unit: 0, power: 0 };
      unassigned.forEach((entry) => {
        if (entry.kind === 'building') counts.building += 1;
        if (entry.kind === 'unit') counts.unit += 1;
        if (entry.kind === 'power') counts.power += 1;
      });
      const rows = unassigned.map((entry) => {
        const timeLabel = formatMatchClock(entry.timeMs);
        const tag = resolveTag(entry.kind);
        return `
          <div class="grid grid-cols-[72px_minmax(0,1fr)] gap-3 items-start text-xs">
            <span class="font-mono text-cyan-300">${timeLabel}</span>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-gray-200 truncate">${entry.playerName}</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider ${tag.className}">${tag.label}</span>
                <span class="text-gray-300">${entry.label}</span>
                ${renderTechTierBadge(entry)}
              </div>
              ${entry.detail ? `<div class="text-[10px] text-gray-500 mt-1">${entry.detail}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');

      teamCards.push(`
        <div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[10px] uppercase tracking-wider text-gray-400">Unknown Team</p>
            <span class="text-[10px] uppercase tracking-wider text-gray-500">${unassigned.length} events</span>
          </div>
          <div class="flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-gray-500 mb-3">
            <span>Buildings <span class="text-emerald-200">${counts.building}</span></span>
            <span>Units <span class="text-sky-200">${counts.unit}</span></span>
            <span>Powers <span class="text-amber-200">${counts.power}</span></span>
          </div>
          <div class="space-y-3">
            ${rows}
          </div>
        </div>
      `);
    }

    listEl.innerHTML = teamCards.join('');
  };

  const updateFilter = () => {
    if (playerFilter) {
      filterState.player = playerFilter.value;
    }
    const selected = new Set<string>();
    typeInputs.forEach((input) => {
      if (input.checked) selected.add(input.value);
    });
    filterState.types = selected;
    if (startInput) {
      const value = Number(startInput.value);
      filterState.startMin = Number.isFinite(value) ? Math.max(0, value) : 0;
    }
    if (endInput) {
      const value = Number(endInput.value);
      filterState.endMin = Number.isFinite(value) ? Math.max(0, value) : maxMinutes;
    }
    if (filterState.startMin > filterState.endMin) {
      filterState.endMin = filterState.startMin;
      if (endInput) endInput.value = String(filterState.endMin);
    }
    renderTimelineList();
  };

  if (playerFilter) playerFilter.addEventListener('change', updateFilter);
  typeInputs.forEach((input) => input.addEventListener('change', updateFilter));
  if (startInput) startInput.addEventListener('change', updateFilter);
  if (endInput) endInput.addEventListener('change', updateFilter);
  renderTimelineList();

  timelineEl.removeAttribute('data-loading');
  timelineEl.setAttribute('data-loaded', 'true');
}
