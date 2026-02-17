import type { TimelineEntry, PlayerInfo } from './types';
import { formatMatchClock } from './dataProcessing';

type BuildOrderPlayer = {
  playerIndex: number;
  playerName: string;
  teamId: number | null;
  entries: TimelineEntry[];
};

const KIND_STYLES: Record<string, { className: string; label: string }> = {
  building: { className: 'border-emerald-400/40 text-emerald-200 bg-emerald-400/10', label: 'Bldg' },
  upgrade: { className: 'border-orange-400/40 text-orange-200 bg-orange-400/10', label: 'Upgr' },
  unit: { className: 'border-sky-400/40 text-sky-200 bg-sky-400/10', label: 'Unit' },
  unit_upgrade: { className: 'border-teal-400/40 text-teal-200 bg-teal-400/10', label: 'Tech' },
};

const BUILD_KINDS = new Set(['building', 'upgrade', 'unit', 'unit_upgrade']);
const MAX_BUILD_ENTRIES = 8;

export function extractBuildOrders(
  entries: TimelineEntry[],
  playersByIndex: Map<number, PlayerInfo>
): BuildOrderPlayer[] {
  const byPlayer = new Map<number, TimelineEntry[]>();

  const sorted = [...entries]
    .filter((e) => BUILD_KINDS.has(e.kind) && e.playerIndex != null)
    .sort((a, b) => a.timeMs - b.timeMs);

  for (const entry of sorted) {
    const pIdx = entry.playerIndex!;
    const list = byPlayer.get(pIdx);
    if (list) {
      if (list.length < MAX_BUILD_ENTRIES) list.push(entry);
    } else {
      byPlayer.set(pIdx, [entry]);
    }
  }

  const result: BuildOrderPlayer[] = [];
  for (const [pIdx, pEntries] of byPlayer) {
    const info = playersByIndex.get(pIdx);
    if (info?.playerType === 3) continue; // skip NPCs
    result.push({
      playerIndex: pIdx,
      playerName: info?.name || `Player ${pIdx}`,
      teamId: info?.teamId ?? null,
      entries: pEntries,
    });
  }

  // Sort by team then player index
  result.sort((a, b) => {
    const teamDiff = (a.teamId ?? 99) - (b.teamId ?? 99);
    return teamDiff !== 0 ? teamDiff : a.playerIndex - b.playerIndex;
  });

  return result;
}

export function renderBuildOrderSummary(buildOrders: BuildOrderPlayer[]): string {
  if (buildOrders.length === 0) return '';

  const playerCards = buildOrders.map((player) => {
    const teamLabel = typeof player.teamId === 'number' ? `Team ${player.teamId}` : '';
    const rows = player.entries.map((entry) => {
      const style = KIND_STYLES[entry.kind] || KIND_STYLES.unit;
      const timeLabel = formatMatchClock(entry.timeMs);
      // Strip the verb prefix ("Completed ", "Trained ", etc.) for compact display
      const shortLabel = entry.label
        .replace(/^(Completed|Trained|Upgraded to|Upgraded .* ->|Researched)\s+/i, '')
        .trim() || entry.label;
      return `
        <div class="flex items-center gap-2 text-[11px]">
          <span class="font-mono text-cyan-300/80 w-[52px] shrink-0 text-right">${timeLabel}</span>
          <span class="inline-flex items-center px-1.5 py-0 rounded border text-[9px] uppercase tracking-wider ${style.className}">${style.label}</span>
          <span class="text-gray-200 truncate">${shortLabel}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-2.5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[11px] font-semibold text-gray-100">${player.playerName}</span>
          ${teamLabel ? `<span class="text-[10px] text-gray-500">${teamLabel}</span>` : ''}
        </div>
        <div class="space-y-1.5">
          ${rows}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="build-order-summary rounded-lg border border-slate-700/40 bg-slate-800/30 p-3 mb-3">
      <div class="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Opening Build Order</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        ${playerCards}
      </div>
    </div>
  `;
}
