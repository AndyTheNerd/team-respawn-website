import { MATCH_FETCH_COUNT, CURRENT_SEASON } from './state';
import {
  getMatchmakingSummaries, getCustomSummaries, sumSummaryTotals,
  parseDuration, parseDurationHours, getHighestTerminusWave,
  getMatchesWon, getMatchesLost, getMatchesCompleted, buildLeaderStatsFromMatches,
} from './dataProcessing';
import { getCsrTier } from '../../data/haloWars2/csr';
import { getLeaderName } from '../../data/haloWars2/leaders';
import { getSeasonName } from '../../data/haloWars2/seasons';
import { PLAYLIST_1V1_RANKED, PLAYLIST_2V2_RANKED, PLAYLIST_3V3_RANKED } from '../../data/haloWars2/playlistMappings';
import { getPlayerStats, getPlayerMatches, getPlayerSeasonStats, getCampaignProgress } from '../../utils/haloApi';
import { getMapName } from '../../data/haloWars2/maps';

const DIFFICULTY_NAMES: Record<number, string> = { 1: 'Easy', 2: 'Normal', 3: 'Heroic', 4: 'Legendary' };

function getCampaignSummary(campaignData: any) {
  if (!campaignData) return null;
  const levels = campaignData.Levels || {};
  const levelIds = Object.keys(levels).map(Number).filter(n => !isNaN(n));
  if (levelIds.length === 0 && !campaignData.CampaignXP) return null;

  let soloCompleted = 0, coopCompleted = 0;
  let highestDiffSolo = -1, highestDiffCoop = -1;
  let totalSoloTimeMs = 0, totalCoopTimeMs = 0;
  let totalSkulls = 0;

  levelIds.forEach(id => {
    const level = levels[id];
    if (!level) return;
    totalSoloTimeMs += parseDurationHours(level.TotalSoloPlayTime) * 3600000;
    totalCoopTimeMs += parseDurationHours(level.TotalCooperativePlayTime) * 3600000;
    if (Array.isArray(level.SkullsUnlocked)) totalSkulls += level.SkullsUnlocked.length;
    const solo = level.SoloCompletion;
    if (solo && typeof solo === 'object' && Object.keys(solo).length > 0) {
      soloCompleted++;
      const ids = Object.keys(solo).map(Number).filter(n => !isNaN(n));
      if (ids.length > 0) highestDiffSolo = Math.max(highestDiffSolo, ...ids);
    }
    const coop = level.CooperativeCompletion;
    if (coop && typeof coop === 'object' && Object.keys(coop).length > 0) {
      coopCompleted++;
      const ids = Object.keys(coop).map(Number).filter(n => !isNaN(n));
      if (ids.length > 0) highestDiffCoop = Math.max(highestDiffCoop, ...ids);
    }
  });

  const xp = campaignData.CampaignXP ?? 0;
  const logs = Array.isArray(campaignData.LogsUnlocked) ? campaignData.LogsUnlocked.length : 0;
  const totalLevels = levelIds.length;
  const totalTimeMs = totalSoloTimeMs + totalCoopTimeMs;
  const timeStr = totalTimeMs > 0 ? parseDuration(`PT${Math.round(totalTimeMs / 1000)}S`) : '0h';
  const highestDiff = Math.max(highestDiffSolo, highestDiffCoop);
  const diffName = highestDiff > 0 ? (DIFFICULTY_NAMES[highestDiff] ?? `Diff ${highestDiff}`) : 'N/A';

  return { xp, logs, totalSkulls, totalLevels, soloCompleted, coopCompleted, highestDiffSolo, highestDiffCoop, highestDiff, diffName, timeStr };
}

function statCell(label: string, value1: string, value2: string, highlightBetter: 'higher' | 'lower' | 'none' = 'none'): string {
  let class1 = 'text-white';
  let class2 = 'text-white';
  if (highlightBetter !== 'none') {
    const n1 = parseFloat(value1.replace(/[^0-9.-]/g, ''));
    const n2 = parseFloat(value2.replace(/[^0-9.-]/g, ''));
    if (!isNaN(n1) && !isNaN(n2) && n1 !== n2) {
      const better = highlightBetter === 'higher' ? (n1 > n2 ? 1 : 2) : (n1 < n2 ? 1 : 2);
      class1 = better === 1 ? 'text-green-400' : 'text-red-400';
      class2 = better === 2 ? 'text-green-400' : 'text-red-400';
    }
  }
  return `
    <div class="grid grid-cols-3 gap-2 py-2 border-b border-slate-700/30 text-sm">
      <span class="font-mono font-bold ${class1} text-right">${value1}</span>
      <span class="text-gray-400 text-xs uppercase tracking-wider text-center self-center">${label}</span>
      <span class="font-mono font-bold ${class2} text-left">${value2}</span>
    </div>
  `;
}

function buildRankedComparisonCard(stat1: any, stat2: any, label: string): string {
  const buildSide = (stat: any) => {
    if (!stat) return { tierTitle: 'Unranked', csrRaw: '-', imageHtml: '<span class="text-gray-500 text-xs">N/A</span>', wins: 0, losses: 0, wr: '0.0' };
    const csr = stat.CurrentCsr || stat.HighestCsr || { Designation: 0, Tier: 0 };
    const tier = getCsrTier(csr.Designation, csr.Tier);
    const wins = getMatchesWon(stat);
    const losses = getMatchesLost(stat);
    const total = wins + losses || getMatchesCompleted(stat);
    const wr = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
    const imageHtml = tier.imageUrl
      ? `<img src="${tier.imageUrl}" alt="${tier.title}" class="w-12 h-12 object-contain" loading="lazy" />`
      : `<span class="text-cyan-400 text-xs font-mono">${tier.title}</span>`;
    return { tierTitle: tier.title, csrRaw: csr.Raw ? String(Math.round(csr.Raw)) : '-', imageHtml, wins, losses, wr };
  };

  const s1 = buildSide(stat1);
  const s2 = buildSide(stat2);

  const csrN1 = parseInt(s1.csrRaw) || 0;
  const csrN2 = parseInt(s2.csrRaw) || 0;
  const csrClass1 = csrN1 > csrN2 ? 'text-green-400' : csrN1 < csrN2 ? 'text-red-400' : 'text-cyan-300';
  const csrClass2 = csrN2 > csrN1 ? 'text-green-400' : csrN2 < csrN1 ? 'text-red-400' : 'text-cyan-300';

  return `
    <div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-4">
      <h4 class="text-xs uppercase tracking-wider text-gray-400 text-center mb-3">${label}</h4>
      <div class="grid grid-cols-3 gap-2 items-center mb-3">
        <div class="flex flex-col items-center gap-1">
          ${s1.imageHtml}
          <span class="text-xs text-cyan-300 font-mono">${s1.tierTitle}</span>
        </div>
        <span class="text-xs text-gray-500 text-center uppercase">vs</span>
        <div class="flex flex-col items-center gap-1">
          ${s2.imageHtml}
          <span class="text-xs text-cyan-300 font-mono">${s2.tierTitle}</span>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center text-xs">
        <span class="${csrClass1} font-mono">${s1.csrRaw}</span>
        <span class="text-gray-500">CSR</span>
        <span class="${csrClass2} font-mono">${s2.csrRaw}</span>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center text-xs mt-1">
        <span class="text-gray-300 font-mono">${s1.wins}W/${s1.losses}L</span>
        <span class="text-gray-500">Record</span>
        <span class="text-gray-300 font-mono">${s2.wins}W/${s2.losses}L</span>
      </div>
    </div>
  `;
}

export async function runComparison(gamertag1: string, gamertag2: string, container: HTMLElement) {
  const gt1 = gamertag1.trim();
  const gt2 = gamertag2.trim();
  if (!gt1 || !gt2) return;

  container.innerHTML = `
    <div class="text-center py-8">
      <div class="inline-flex items-center gap-3 text-cyan-300">
        <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
        <span>Loading stats for both players...</span>
      </div>
    </div>
  `;
  container.classList.remove('hidden');

  const [stats1, stats2, matches1, matches2, season1, season2, campaign1, campaign2] = await Promise.all([
    getPlayerStats(gt1),
    getPlayerStats(gt2),
    getPlayerMatches(gt1, MATCH_FETCH_COUNT),
    getPlayerMatches(gt2, MATCH_FETCH_COUNT),
    CURRENT_SEASON ? getPlayerSeasonStats(gt1, CURRENT_SEASON.id) : Promise.resolve({ ok: false, error: { type: 'unknown', message: '' } }),
    CURRENT_SEASON ? getPlayerSeasonStats(gt2, CURRENT_SEASON.id) : Promise.resolve({ ok: false, error: { type: 'unknown', message: '' } }),
    getCampaignProgress(gt1),
    getCampaignProgress(gt2),
  ]);

  if (!stats1.ok || !stats2.ok) {
    const errPlayer = !stats1.ok ? gt1 : gt2;
    const errMsg = !stats1.ok ? (stats1.error?.message || 'Player not found') : (stats2.error?.message || 'Player not found');
    container.innerHTML = `
      <div class="rounded-lg border border-red-500/40 bg-red-900/20 text-red-300 p-4">
        <p class="font-medium">Could not load stats for ${errPlayer}: ${errMsg}</p>
      </div>
    `;
    return;
  }

  const sections: string[] = [];

  // --- Header ---
  sections.push(`
    <div class="grid grid-cols-3 gap-2 mb-6">
      <h3 class="text-lg font-bold text-cyan-300 font-mono text-right truncate">${gt1}</h3>
      <p class="text-gray-500 text-center self-center text-sm uppercase tracking-wider">vs</p>
      <h3 class="text-lg font-bold text-cyan-300 font-mono text-left truncate">${gt2}</h3>
    </div>
  `);

  // --- Career Stats ---
  const buildSummary = (statsData: any) => {
    const summaries = getMatchmakingSummaries(statsData);
    const allSummaries = [...summaries, ...getCustomSummaries(statsData)];
    const mmTotals = sumSummaryTotals(summaries);
    const allTotals = allSummaries.length > 0 ? sumSummaryTotals(allSummaries) : mmTotals;
    const mmLosses = Math.max(0, mmTotals.matches - mmTotals.wins);
    const winRate = mmTotals.matches > 0 ? ((mmTotals.wins / mmTotals.matches) * 100).toFixed(1) : '0.0';
    const timeStr = mmTotals.time >= 1 ? `${Math.round(mmTotals.time)}h` : '<1h';
    const allTimeStr = allTotals.time >= 1 ? `${Math.round(allTotals.time)}h` : '<1h';
    const avgSeconds = mmTotals.matches > 0 ? Math.round((mmTotals.time / mmTotals.matches) * 3600) : 0;
    const avgMatch = avgSeconds > 0 ? parseDuration(`PT${avgSeconds}S`) : '-';
    const terminus = getHighestTerminusWave(statsData);
    return { matches: mmTotals.matches, wins: mmTotals.wins, losses: mmLosses, winRate, timeStr, allTimeStr, avgMatch, terminus };
  };

  const p1 = buildSummary(stats1.data);
  const p2 = buildSummary(stats2.data);

  sections.push('<h4 class="text-sm uppercase tracking-wider text-gray-400 mb-2">Career Stats (Matchmaking)</h4>');
  sections.push('<div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-4 mb-6">');
  sections.push(statCell('Matches', p1.matches.toLocaleString(), p2.matches.toLocaleString(), 'higher'));
  sections.push(statCell('Wins', p1.wins.toLocaleString(), p2.wins.toLocaleString(), 'higher'));
  sections.push(statCell('Losses', p1.losses.toLocaleString(), p2.losses.toLocaleString(), 'lower'));
  sections.push(statCell('Win Rate', `${p1.winRate}%`, `${p2.winRate}%`, 'higher'));
  sections.push(statCell('Time Played', p1.timeStr, p2.timeStr, 'none'));
  sections.push(statCell('All Modes Time', p1.allTimeStr, p2.allTimeStr, 'none'));
  sections.push(statCell('Avg Match', p1.avgMatch, p2.avgMatch, 'none'));
  sections.push(statCell('Terminus Wave', p1.terminus > 0 ? String(p1.terminus) : '-', p2.terminus > 0 ? String(p2.terminus) : '-', 'higher'));
  sections.push('</div>');

  // --- Ranked CSR Comparison ---
  const playlistIds = [
    { id: PLAYLIST_1V1_RANKED, label: '1v1 Ranked' },
    { id: PLAYLIST_2V2_RANKED, label: '2v2 Ranked' },
    { id: PLAYLIST_3V3_RANKED, label: '3v3 Ranked' },
  ];

  const summaries1 = getMatchmakingSummaries(stats1.data);
  const summaries2 = getMatchmakingSummaries(stats2.data);
  const ranked1 = summaries1.filter((s: any) => s.PlaylistId && playlistIds.some(p => p.id === s.PlaylistId));
  const ranked2 = summaries2.filter((s: any) => s.PlaylistId && playlistIds.some(p => p.id === s.PlaylistId));

  sections.push('<h4 class="text-sm uppercase tracking-wider text-gray-400 mb-2">Ranked CSR (All-Time)</h4>');
  sections.push('<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">');
  playlistIds.forEach(playlist => {
    const stat1 = ranked1.find((s: any) => s.PlaylistId === playlist.id);
    const stat2 = ranked2.find((s: any) => s.PlaylistId === playlist.id);
    sections.push(buildRankedComparisonCard(stat1, stat2, playlist.label));
  });
  sections.push('</div>');

  // --- Leader Usage Comparison ---
  const matchesList1 = matches1.ok ? (matches1.data.Results || []) : [];
  const matchesList2 = matches2.ok ? (matches2.data.Results || []) : [];

  if (matchesList1.length > 0 || matchesList2.length > 0) {
    const leaderStats1 = buildLeaderStatsFromMatches(matchesList1);
    const leaderStats2 = buildLeaderStatsFromMatches(matchesList2);

    const allLeaderIds = new Set([...leaderStats1.keys(), ...leaderStats2.keys()]);
    const leaderRows = [...allLeaderIds]
      .map(id => {
        const s1 = leaderStats1.get(id) || { matches: 0, wins: 0 };
        const s2 = leaderStats2.get(id) || { matches: 0, wins: 0 };
        return { id, name: getLeaderName(id), s1, s2 };
      })
      .sort((a, b) => (b.s1.matches + b.s2.matches) - (a.s1.matches + a.s2.matches));

    if (leaderRows.length > 0) {
      sections.push('<h4 class="text-sm uppercase tracking-wider text-gray-400 mb-2">Leader Usage (Recent Matches)</h4>');
      sections.push('<div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-4 mb-6">');
      sections.push(`
        <div class="grid grid-cols-[auto_1fr_auto_auto_1fr_auto] gap-x-3 gap-y-1 text-xs items-center">
          <span class="text-gray-500 uppercase tracking-wider">Plays</span>
          <span class="text-gray-500 uppercase tracking-wider text-right">WR%</span>
          <span></span>
          <span></span>
          <span class="text-gray-500 uppercase tracking-wider">WR%</span>
          <span class="text-gray-500 uppercase tracking-wider text-right">Plays</span>
      `);
      leaderRows.slice(0, 10).forEach(row => {
        const wr1 = row.s1.matches > 0 ? ((row.s1.wins / row.s1.matches) * 100).toFixed(0) : '-';
        const wr2 = row.s2.matches > 0 ? ((row.s2.wins / row.s2.matches) * 100).toFixed(0) : '-';
        sections.push(`
          <span class="font-mono text-gray-300 text-right">${row.s1.matches || '-'}</span>
          <span class="font-mono text-cyan-300 text-right">${wr1 !== '-' ? wr1 + '%' : '-'}</span>
          <span class="text-gray-200 text-center col-span-2 font-medium">${row.name}</span>
          <span class="font-mono text-cyan-300">${wr2 !== '-' ? wr2 + '%' : '-'}</span>
          <span class="font-mono text-gray-300 text-right">${row.s2.matches || '-'}</span>
        `);
      });
      sections.push('</div></div>');
    }
  }

  // --- Head-to-Head Matchups ---
  if (matchesList1.length > 0 && matchesList2.length > 0) {
    const gt1Lower = gt1.toLowerCase();
    const gt2Lower = gt2.toLowerCase();

    const sharedMatches: Array<{ match: any; p1Outcome: string; p2Outcome: string; mapName: string; dateStr: string }> = [];
    const matchIds2 = new Set(matchesList2.map((m: any) => m.MatchId));

    matchesList1.forEach((m1: any) => {
      if (!m1.MatchId || !matchIds2.has(m1.MatchId)) return;
      const m2 = matchesList2.find((m: any) => m.MatchId === m1.MatchId);
      if (!m2) return;

      const findOutcome = (match: any, gt: string) => {
        const player = match.Players?.find((p: any) => {
          const id = p.HumanPlayerId || p.Gamertag || p.PlayerId;
          return id && String(id).toLowerCase() === gt;
        });
        const outcome = player?.MatchOutcome ?? match.PlayerMatchOutcome;
        return outcome === 1 ? 'Win' : outcome === 2 ? 'Loss' : 'Draw';
      };

      sharedMatches.push({
        match: m1,
        p1Outcome: findOutcome(m1, gt1Lower),
        p2Outcome: findOutcome(m2, gt2Lower),
        mapName: getMapName(m1.MapId || ''),
        dateStr: m1.MatchStartDate?.ISO8601Date
          ? new Date(m1.MatchStartDate.ISO8601Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '',
      });
    });

    if (sharedMatches.length > 0) {
      const p1Wins = sharedMatches.filter(m => m.p1Outcome === 'Win' && m.p2Outcome === 'Loss').length;
      const p2Wins = sharedMatches.filter(m => m.p2Outcome === 'Win' && m.p1Outcome === 'Loss').length;
      const sameTeam = sharedMatches.filter(m => m.p1Outcome === m.p2Outcome).length;

      sections.push(`<h4 class="text-sm uppercase tracking-wider text-gray-400 mb-1">Head-to-Head</h4>`);
      sections.push(`<p class="text-[10px] text-gray-500 mb-2">Based on last ${matchesList1.length} matches for ${gt1} and last ${matchesList2.length} matches for ${gt2}</p>`);
      sections.push('<div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-4 mb-6">');
      sections.push(`
        <div class="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <p class="text-2xl font-bold font-mono ${p1Wins > p2Wins ? 'text-green-400' : p1Wins < p2Wins ? 'text-red-400' : 'text-gray-300'}">${p1Wins}</p>
            <p class="text-[10px] uppercase tracking-wider text-gray-500">${gt1} wins</p>
          </div>
          <div>
            <p class="text-lg font-bold font-mono text-gray-400">${sharedMatches.length}</p>
            <p class="text-[10px] uppercase tracking-wider text-gray-500">Shared matches</p>
            ${sameTeam > 0 ? `<p class="text-[10px] text-gray-500 mt-1">${sameTeam} on same team</p>` : ''}
          </div>
          <div>
            <p class="text-2xl font-bold font-mono ${p2Wins > p1Wins ? 'text-green-400' : p2Wins < p1Wins ? 'text-red-400' : 'text-gray-300'}">${p2Wins}</p>
            <p class="text-[10px] uppercase tracking-wider text-gray-500">${gt2} wins</p>
          </div>
        </div>
      `);

      sections.push('<div class="space-y-1">');
      sharedMatches.slice(0, 10).forEach(m => {
        const p1Color = m.p1Outcome === 'Win' ? 'text-green-400' : m.p1Outcome === 'Loss' ? 'text-red-400' : 'text-gray-400';
        const p2Color = m.p2Outcome === 'Win' ? 'text-green-400' : m.p2Outcome === 'Loss' ? 'text-red-400' : 'text-gray-400';
        sections.push(`
          <div class="grid grid-cols-[1fr_auto_1fr] gap-2 text-xs items-center py-1 border-b border-slate-700/20">
            <span class="font-mono ${p1Color} text-right">${m.p1Outcome}</span>
            <span class="text-gray-500 text-center">${m.mapName} <span class="text-gray-600">${m.dateStr}</span></span>
            <span class="font-mono ${p2Color}">${m.p2Outcome}</span>
          </div>
        `);
      });
      if (sharedMatches.length > 10) {
        sections.push(`<p class="text-xs text-gray-500 text-center mt-2">...and ${sharedMatches.length - 10} more shared matches</p>`);
      }
      sections.push('</div></div>');
    } else {
      sections.push(`<h4 class="text-sm uppercase tracking-wider text-gray-400 mb-1">Head-to-Head</h4>`);
      sections.push(`<p class="text-[10px] text-gray-500 mb-2">Checked last ${matchesList1.length} matches for ${gt1} and last ${matchesList2.length} matches for ${gt2}</p>`);
      sections.push('<p class="text-gray-500 text-sm mb-6">No shared matches found in recent match history.</p>');
    }
  }

  // --- Campaign Comparison ---
  const c1 = campaign1.ok ? getCampaignSummary(campaign1.data) : null;
  const c2 = campaign2.ok ? getCampaignSummary(campaign2.data) : null;

  if (c1 || c2) {
    const s1 = c1 || { xp: 0, logs: 0, totalSkulls: 0, totalLevels: 0, soloCompleted: 0, coopCompleted: 0, highestDiff: -1, diffName: 'N/A', timeStr: '0h' };
    const s2 = c2 || { xp: 0, logs: 0, totalSkulls: 0, totalLevels: 0, soloCompleted: 0, coopCompleted: 0, highestDiff: -1, diffName: 'N/A', timeStr: '0h' };

    sections.push('<h4 class="text-sm uppercase tracking-wider text-gray-400 mb-2">Campaign Progress</h4>');
    sections.push('<div class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-4 mb-6">');
    sections.push(statCell('Campaign XP', s1.xp.toLocaleString(), s2.xp.toLocaleString(), 'higher'));
    sections.push(statCell('Levels (Solo)', `${s1.soloCompleted}/${s1.totalLevels}`, `${s2.soloCompleted}/${s2.totalLevels}`, 'higher'));
    sections.push(statCell('Levels (Co-op)', `${s1.coopCompleted}/${s1.totalLevels}`, `${s2.coopCompleted}/${s2.totalLevels}`, 'higher'));
    sections.push(statCell('Highest Diff.', s1.diffName, s2.diffName, 'none'));
    sections.push(statCell('Skulls Found', String(s1.totalSkulls), String(s2.totalSkulls), 'higher'));
    sections.push(statCell('Logs Found', String(s1.logs), String(s2.logs), 'higher'));
    sections.push(statCell('Time Played', s1.timeStr, s2.timeStr, 'none'));
    sections.push('</div>');
  }

  container.innerHTML = sections.join('');
}
