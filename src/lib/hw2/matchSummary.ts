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
      <div class="flex items-center gap-3 text-sm text-gray-300" role="status" aria-live="polite">
        <i class="fas fa-spinner fa-spin text-cyan-300" aria-hidden="true"></i>
        <span>Generating AI summary...</span>
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

    const data = await response.json() as { summary: string; model: string; provider?: string; cached: boolean };
    const provider = data.provider || getProviderLabel(data.model);

    el.innerHTML = `
      <div class="rounded-lg border border-cyan-500/20 bg-slate-800/30 p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-base">✨</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-cyan-300">AI Summary</span>
          ${data.cached ? '<span class="text-[10px] text-gray-500 ml-auto">cached</span>' : ''}
        </div>
        <p class="text-sm text-gray-200 leading-relaxed">${escapeHtml(data.summary)}</p>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500">
          <p>Double check stats, AI summary can make mistakes</p>
          <p>Provider: ${escapeHtml(provider)}</p>
        </div>
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

function getProviderLabel(model: string): string {
  const parenMatch = model.match(/\(([^)]+)\)\s*$/);
  if (parenMatch?.[1]) return parenMatch[1];
  if (/groq/i.test(model)) return 'Groq';
  if (/cerebras/i.test(model)) return 'Cerebras';
  return model || 'Unknown';
}
