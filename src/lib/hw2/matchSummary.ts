export type PlayerSummary = {
  gamertag: string;
  leader: string;
  teamId: number | null;
  unitsDestroyed: number;
  unitsLost: number;
  topPowers: string[]; // e.g. ["Carpet Bombing x3", "ODST Drop x2"]
  techT2Min: number | null;
  techT3Min: number | null;
  firstBuilding: string | null;
  firstUnit: string | null;
};

export type MatchSummaryContext = {
  result: string;
  mapName: string;
  duration: string;
  teamSize: string;
  playlist: string;
  csrDelta: string;
  completed: boolean | null;
  date: string;
  you: PlayerSummary;
  allies: PlayerSummary[];
  opponents: PlayerSummary[];
};

export async function loadMatchSummary(
  matchId: string,
  gamertag: string,
  matchContext: MatchSummaryContext,
  el: HTMLElement
): Promise<void> {
  if (el.getAttribute('data-loaded') === 'true') return;

  el.innerHTML = `
    <div class="rounded-lg border border-cyan-500/20 bg-slate-800/30 p-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-base">✨</span>
        <span class="text-xs font-semibold uppercase tracking-wider text-cyan-300">AI Summary</span>
      </div>
      <div class="space-y-2">
        <div class="h-3 bg-slate-700/50 rounded animate-pulse w-full"></div>
        <div class="h-3 bg-slate-700/50 rounded animate-pulse w-5/6"></div>
        <div class="h-3 bg-slate-700/50 rounded animate-pulse w-4/6"></div>
        <div class="h-3 bg-slate-700/50 rounded animate-pulse w-full"></div>
        <div class="h-3 bg-slate-700/50 rounded animate-pulse w-3/4"></div>
      </div>
    </div>
  `;

  try {
    const params = new URLSearchParams({ matchId, gamertag });
    const response = await fetch(`/api/hw2/match-summary?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchContext),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const data = await response.json() as { summary: string; model: string; cached: boolean };

    el.innerHTML = `
      <div class="rounded-lg border border-cyan-500/20 bg-slate-800/30 p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-base">✨</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-cyan-300">AI Summary</span>
          ${data.cached ? '<span class="text-[10px] text-gray-500 ml-auto">cached</span>' : ''}
        </div>
        <p class="text-sm text-gray-200 leading-relaxed">${escapeHtml(data.summary)}</p>
        <p class="text-[10px] text-gray-500 mt-3">Double check stats, AI summary can make mistakes</p>
      </div>
    `;
    el.setAttribute('data-loaded', 'true');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load summary.';
    el.innerHTML = `
      <div class="rounded-lg border border-red-500/20 bg-red-900/10 p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-base">✨</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-red-300">AI Summary</span>
        </div>
        <p class="text-sm text-red-300">${escapeHtml(msg)}</p>
      </div>
    `;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
