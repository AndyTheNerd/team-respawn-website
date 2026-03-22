import { CURRENT_SEASON } from './state';
import { hideSkeleton } from './uiState';
import { getMatchmakingSummaries, getMatchesWon, getMatchesLost, getMatchesCompleted } from './dataProcessing';
import { getCsrTier } from '../../data/haloWars2/csr';
import { getSeasonName } from '../../data/haloWars2/seasons';
import { PLAYLIST_1V1_RANKED, PLAYLIST_2V2_RANKED, PLAYLIST_3V3_RANKED } from '../../data/haloWars2/playlistMappings';

export function renderRankedStats(stats: any, seasonStats?: any) {
  hideSkeleton('ranked');
  const rankedContent = document.getElementById('ranked-content')!;

  const playlistIds = [
    { id: PLAYLIST_1V1_RANKED, label: '1v1 Ranked' },
    { id: PLAYLIST_2V2_RANKED, label: '2v2 Ranked' },
    { id: PLAYLIST_3V3_RANKED, label: '3v3 Ranked' },
  ];

  const summaries = getMatchmakingSummaries(stats);
  const rankedStats = summaries.filter((s: any) => s.PlaylistId && playlistIds.some(p => p.id === s.PlaylistId));

  const seasonRanked = seasonStats?.RankedPlaylistStats || [];
  const seasonLabel = CURRENT_SEASON ? getSeasonName(CURRENT_SEASON.id) : 'Current Season';

  const buildCard = (stat: any, label: string, subLabel: string, emptyText: string, showProgress: boolean) => {
    if (!stat) {
      return `
        <div class="rounded-xl p-6 border border-cyan-500/20 text-center" style="background: rgba(30, 41, 59, 0.4);">
          <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">${label}</h3>
          <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-4">${subLabel}</p>
          <p class="text-gray-500 text-sm">${emptyText}</p>
        </div>
      `;
    }

    const csr = stat.CurrentCsr || stat.HighestCsr || { Designation: 0, Tier: 0 };
    const tier = getCsrTier(csr.Designation, csr.Tier);
    const wins = getMatchesWon(stat);
    const losses = getMatchesLost(stat);
    const recordTotal = wins + losses;
    const total = recordTotal > 0 ? recordTotal : getMatchesCompleted(stat);
    const wr = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
    const progressRaw = csr?.PercentToNextTier;
    const progressPct = showProgress && typeof progressRaw === 'number'
      ? Math.max(0, Math.min(100, progressRaw))
      : null;
    const progressTitle = progressPct != null ? `${Math.round(progressPct)}% to next tier` : '';
    const ringRadius = 46;
    const ringCirc = 2 * Math.PI * ringRadius;
    const ringOffset = progressPct != null
      ? ringCirc * (1 - (progressPct / 100))
      : ringCirc;

    return `
      <div class="rounded-xl p-6 border border-cyan-500/20 text-center" style="background: rgba(30, 41, 59, 0.4);">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">${label}</h3>
        <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-4">${subLabel}</p>
        <div class="relative w-24 h-24 mx-auto mb-3 flex items-center justify-center"${progressPct != null ? ` title="${progressTitle}"` : ''}>
          ${progressPct != null ? `
            <svg class="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="${ringRadius}" fill="none" stroke="rgba(148, 163, 184, 0.25)" stroke-width="8"></circle>
              <circle cx="60" cy="60" r="${ringRadius}" fill="none" stroke="rgba(34, 211, 238, 0.9)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${ringCirc}" stroke-dashoffset="${ringOffset}"></circle>
            </svg>
          ` : ''}
          <div class="csr-glow rounded-full w-20 h-20 flex items-center justify-center bg-slate-800/60 border border-cyan-500/30">
            ${tier.imageUrl
              ? `<img src="${tier.imageUrl}" alt="${tier.title}" class="w-16 h-16 object-contain" loading="lazy" />`
              : `<span class="text-cyan-400 text-xs font-mono">${tier.title}</span>`
            }
          </div>
        </div>
        <p class="text-cyan-300 font-semibold font-mono text-sm mb-1">${tier.title}</p>
        ${csr.Raw ? `<p class="text-xs text-gray-400 font-mono mb-2">CSR: ${Math.round(csr.Raw)}</p>` : ''}
        <div class="flex justify-center gap-4 text-xs">
          <span class="text-green-400 font-mono">${wins}W</span>
          <span class="text-red-400 font-mono">${losses}L</span>
          <span class="text-cyan-300 font-mono">${wr}%</span>
        </div>
      </div>
    `;
  };

  const lifetimeCards = playlistIds.map(p => {
    const stat = rankedStats.find((s: any) => s.PlaylistId === p.id);
    return buildCard(stat, p.label, 'All-Time High', 'No ranked data', true);
  });

  const seasonCards = playlistIds.map(p => {
    const stat = seasonRanked.find((s: any) => s.PlaylistId === p.id);
    return buildCard(stat, p.label, seasonLabel, 'No season data', true);
  });

  rankedContent.innerHTML = [...lifetimeCards, ...seasonCards].join('');
  rankedContent.classList.remove('hidden');
}
