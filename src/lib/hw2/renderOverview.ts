import { state } from './state';
import { profileShareBtn } from './dom';
import { hideSkeleton, showError } from './uiState';
import {
  getMatchmakingSummaries, getCustomSummaries, sumSummaryTotals,
  parseDuration, getHighestTerminusWave, renderVideoCta,
} from './dataProcessing';
import { buildProfileUrl } from './urlProfile';

export function renderOverview(stats: any, gamertag: string) {
  hideSkeleton('overview');
  const overviewContent = document.getElementById('overview-content')!;
  const overviewError = document.getElementById('overview-error')!;
  if (profileShareBtn) {
    profileShareBtn.classList.add('hidden');
    profileShareBtn.disabled = true;
  }

  const summaries = getMatchmakingSummaries(stats);
  const allSummaries = [...summaries, ...getCustomSummaries(stats)];
  if (summaries.length === 0) {
    showError(overviewError, { type: 'not_found', message: 'No matchmaking stats found for this player.' });
    return;
  }

  const mmTotals = sumSummaryTotals(summaries);
  const allTotals = allSummaries.length > 0 ? sumSummaryTotals(allSummaries) : mmTotals;
  const mmLosses = Math.max(0, mmTotals.matches - mmTotals.wins);

  const winRateValue = mmTotals.matches > 0 ? (mmTotals.wins / mmTotals.matches) * 100 : 0;
  const winRate = winRateValue.toFixed(1);
  const timeStr = mmTotals.time >= 1 ? `${Math.round(mmTotals.time)}h` : '<1h';
  const allTimeStr = allTotals.time >= 1 ? `${Math.round(allTotals.time)}h` : '<1h';
  const avgMatchSeconds = mmTotals.matches > 0 ? Math.round((mmTotals.time / mmTotals.matches) * 3600) : 0;
  const avgMatchStr = avgMatchSeconds > 0 ? parseDuration(`PT${avgMatchSeconds}S`) : '-';
  const terminusWave = getHighestTerminusWave(stats);
  const winRateLabel =
    winRateValue >= 60
      ? 'Sweaty Pro Player'
      : winRateValue > 45
        ? 'Average TR viewer'
        : 'Cringe worthy bad';

  document.getElementById('stat-matches')!.textContent = mmTotals.matches.toLocaleString();
  document.getElementById('stat-wins')!.textContent = mmTotals.wins.toLocaleString();
  document.getElementById('stat-losses')!.textContent = mmLosses.toLocaleString();
  document.getElementById('stat-winrate')!.textContent = `${winRate}%`;
  document.getElementById('stat-winrate-label')!.textContent = winRateLabel;
  document.getElementById('stat-time')!.textContent = timeStr;
  document.getElementById('stat-time-all')!.textContent = `All modes: ${allTimeStr}`;
  document.getElementById('stat-avg-match')!.textContent = avgMatchStr;
  document.getElementById('stat-terminus-wave')!.textContent = terminusWave > 0 ? String(terminusWave) : '-';
  const shareUrl = buildProfileUrl(gamertag);
  const shareTitle = `${gamertag} | Halo Wars 2 Stats Profile`;
  const shareText = `${gamertag} | ${winRate}% win rate | ${winRateLabel} | ${mmTotals.matches} matches | Avg match ${avgMatchStr}`;
  const subtitle = `Matchmaking: ${winRate}% win rate`;
  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dateStr = `Updated ${dateLabel}`;
  state.activeProfileShareData = {
    gamertag,
    subtitle,
    matches: mmTotals.matches.toLocaleString(),
    wins: mmTotals.wins.toLocaleString(),
    losses: mmLosses.toLocaleString(),
    winRate: `${winRate}%`,
    viewerRating: winRateLabel,
    timeStr,
    avgMatchStr,
    terminusWave: terminusWave > 0 ? String(terminusWave) : '-',
    dateStr,
    shareUrl,
    shareTitle,
    shareText,
  };
  if (profileShareBtn) {
    profileShareBtn.classList.remove('hidden');
    profileShareBtn.disabled = false;
  }
  renderVideoCta();
  overviewContent.classList.remove('hidden');
}
