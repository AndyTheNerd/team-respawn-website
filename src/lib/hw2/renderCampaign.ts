import { hideSkeleton } from './uiState';
import { parseDuration, parseDurationHours } from './dataProcessing';

// --- HW2 Campaign level structure (static game content) ---
// Level IDs from the HW2 campaign-levels metadata.
// Main Campaign: missions 1–12, Operation Spearbreaker: 2 missions, Awakening the Nightmare: 5 missions.

type CampaignGroup = {
  label: string;
  icon: string;
  levelIds: number[];
};

// These will be populated from the metadata API; fallback to showing raw level IDs
let campaignGroups: CampaignGroup[] | null = null;
let allKnownLevelIds: Set<number> | null = null;

const DIFFICULTY_NAMES: Record<number, string> = {
  1: 'Easy',
  2: 'Normal',
  3: 'Heroic',
  4: 'Legendary',
};

function getDifficultyName(id: number): string {
  return DIFFICULTY_NAMES[id] ?? `Difficulty ${id}`;
}

function highestDifficultyCompleted(completionMap: Record<string, any> | undefined): string {
  if (!completionMap || typeof completionMap !== 'object') return 'None';
  const ids = Object.keys(completionMap).map(Number).filter(n => !isNaN(n)).sort((a, b) => b - a);
  return ids.length > 0 ? getDifficultyName(ids[0]) : 'None';
}

function highestDifficultyId(completionMap: Record<string, any> | undefined): number {
  if (!completionMap || typeof completionMap !== 'object') return -1;
  const ids = Object.keys(completionMap).map(Number).filter(n => !isNaN(n));
  return ids.length > 0 ? Math.max(...ids) : -1;
}

/**
 * Parse the campaign-levels metadata to build groups.
 * The metadata returns ContentItems, each with a View containing level info.
 */
export function parseCampaignLevelsMetadata(metadata: any): void {
  if (!metadata) return;

  const items = Array.isArray(metadata?.ContentItems) ? metadata.ContentItems : [];
  if (items.length === 0) return;

  // Try to identify campaign groups from metadata
  const levelMap = new Map<number, { name: string; missionNumber?: number; campaignName?: string }>();

  items.forEach((item: any) => {
    const view = item?.View || {};
    const level = view?.HW2CampaignLevel || view?.CampaignLevel || view;
    const id = level?.MissionNumber ?? level?.LevelId ?? level?.Id;
    const displayInfo = level?.DisplayInfo?.View?.HW2CampaignLevelDisplayInfo
      || level?.DisplayInfo?.View
      || level?.DisplayInfo
      || {};
    const name = displayInfo?.Name || displayInfo?.Title || view?.Title || `Mission ${id}`;
    const campaignName = level?.CampaignName || level?.Campaign || '';

    if (id != null) {
      levelMap.set(Number(id), { name: String(name), missionNumber: Number(id), campaignName: String(campaignName) });
    }
  });

  if (levelMap.size === 0) return;

  // Group levels by campaign name if available
  const grouped = new Map<string, number[]>();
  levelMap.forEach((info, id) => {
    const group = info.campaignName || 'Main Campaign';
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(id);
  });

  // Sort level IDs within each group
  grouped.forEach(ids => ids.sort((a, b) => a - b));

  campaignGroups = [];
  allKnownLevelIds = new Set();

  // Create groups with appropriate icons
  const groupOrder = [...grouped.keys()].sort();
  groupOrder.forEach(name => {
    const ids = grouped.get(name)!;
    ids.forEach(id => allKnownLevelIds!.add(id));
    const icon = name.toLowerCase().includes('spearbreaker') ? 'fas fa-crosshairs'
      : name.toLowerCase().includes('nightmare') ? 'fas fa-skull'
      : 'fas fa-flag';
    campaignGroups!.push({ label: name, icon, levelIds: ids });
  });
}

/**
 * Render campaign progress data from the campaign-progress endpoint.
 */
export function renderCampaignStats(campaignData: any, _stats: any) {
  hideSkeleton('campaign');
  const campaignContent = document.getElementById('campaign-content');
  if (!campaignContent) return;

  if (!campaignData) {
    campaignContent.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500 text-sm">No campaign data available for this player.</p>
      </div>`;
    campaignContent.classList.remove('hidden');
    return;
  }

  const campaignXP = campaignData.CampaignXP ?? 0;
  const levels = campaignData.Levels || {};
  const logsUnlocked = Array.isArray(campaignData.LogsUnlocked) ? campaignData.LogsUnlocked.length : 0;

  const levelIds = Object.keys(levels).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);

  if (levelIds.length === 0 && campaignXP === 0) {
    campaignContent.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500 text-sm">No campaign progress found for this player.</p>
      </div>`;
    campaignContent.classList.remove('hidden');
    return;
  }

  // --- Aggregate stats ---
  let totalSoloTime = 0;
  let totalCoopTime = 0;
  let totalSkullsUnlocked = 0;
  let levelsCompletedSolo = 0;
  let levelsCompletedCoop = 0;
  let highestDiffSolo = -1;
  let highestDiffCoop = -1;

  levelIds.forEach(id => {
    const level = levels[id];
    if (!level) return;

    totalSoloTime += parseDurationHours(level.TotalSoloPlayTime) * 3600000;
    totalCoopTime += parseDurationHours(level.TotalCooperativePlayTime) * 3600000;

    if (Array.isArray(level.SkullsUnlocked)) {
      totalSkullsUnlocked += level.SkullsUnlocked.length;
    }

    const soloComp = level.SoloCompletion;
    const coopComp = level.CooperativeCompletion;

    if (soloComp && typeof soloComp === 'object' && Object.keys(soloComp).length > 0) {
      levelsCompletedSolo++;
      const diff = highestDifficultyId(soloComp);
      if (diff > highestDiffSolo) highestDiffSolo = diff;

    }

    if (coopComp && typeof coopComp === 'object' && Object.keys(coopComp).length > 0) {
      levelsCompletedCoop++;
      const diff = highestDifficultyId(coopComp);
      if (diff > highestDiffCoop) highestDiffCoop = diff;

    }
  });

  const totalTimeMsAll = totalSoloTime + totalCoopTime;
  const totalTimeStr = totalTimeMsAll > 0 ? parseDuration(`PT${Math.round(totalTimeMsAll / 1000)}S`) : '0h';

  // --- Build cards ---
  const html: string[] = [];

  // Card 1: Campaign Overview
  html.push(`
    <div class="rounded-xl p-6 border border-cyan-500/20" style="background: rgba(30, 41, 59, 0.4);">
      <div class="flex items-center justify-center gap-2 mb-4">
        <i class="fas fa-scroll text-cyan-400" aria-hidden="true"></i>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Campaign Overview</h3>
      </div>
      <div class="grid grid-cols-2 gap-3 text-center">
        <div class="bg-slate-800/40 rounded-lg p-3 border border-cyan-500/10">
          <p class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Campaign XP</p>
          <p class="text-lg font-bold font-mono text-yellow-400">${campaignXP.toLocaleString()}</p>
        </div>
        <div class="bg-slate-800/40 rounded-lg p-3 border border-cyan-500/10">
          <p class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Total Time</p>
          <p class="text-lg font-bold font-mono text-white">${totalTimeStr}</p>
        </div>
        <div class="bg-slate-800/40 rounded-lg p-3 border border-cyan-500/10">
          <p class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Skulls Found</p>
          <p class="text-lg font-bold font-mono text-purple-400">${totalSkullsUnlocked}</p>
        </div>
        <div class="bg-slate-800/40 rounded-lg p-3 border border-cyan-500/10">
          <p class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Logs Found</p>
          <p class="text-lg font-bold font-mono text-amber-400">${logsUnlocked}</p>
        </div>
      </div>
    </div>
  `);

  // Card 2: Solo Campaign Progress
  html.push(buildModeCard(
    'Solo Campaign', 'fas fa-user',
    levelsCompletedSolo, levelIds.length,
    highestDiffSolo >= 0 ? getDifficultyName(highestDiffSolo) : 'N/A',
    totalSoloTime
  ));

  // Card 3: Co-op Campaign Progress
  html.push(buildModeCard(
    'Co-op Campaign', 'fas fa-user-friends',
    levelsCompletedCoop, levelIds.length,
    highestDiffCoop >= 0 ? getDifficultyName(highestDiffCoop) : 'N/A',
    totalCoopTime
  ));

  // --- Campaign group breakdown (if we have groups from metadata) ---
  if (campaignGroups && campaignGroups.length > 1) {
    html.push(`<div class="col-span-full border-t border-cyan-500/10 pt-4 mt-2"></div>`);
    campaignGroups.forEach(group => {
      const groupLevelIds = group.levelIds.filter(id => levels[id]);
      const totalInGroup = group.levelIds.length;
      let completedSolo = 0;
      let completedCoop = 0;
      let groupHighestDiff = -1;

      groupLevelIds.forEach(id => {
        const level = levels[id];
        if (level?.SoloCompletion && Object.keys(level.SoloCompletion).length > 0) {
          completedSolo++;
          const diff = highestDifficultyId(level.SoloCompletion);
          if (diff > groupHighestDiff) groupHighestDiff = diff;
        }
        if (level?.CooperativeCompletion && Object.keys(level.CooperativeCompletion).length > 0) {
          completedCoop++;
          const diff = highestDifficultyId(level.CooperativeCompletion);
          if (diff > groupHighestDiff) groupHighestDiff = diff;
        }
      });

      const completed = Math.max(completedSolo, completedCoop);
      const pct = totalInGroup > 0 ? Math.round((completed / totalInGroup) * 100) : 0;
      const diffLabel = groupHighestDiff >= 0 ? getDifficultyName(groupHighestDiff) : 'N/A';

      html.push(`
        <div class="rounded-xl p-5 border border-cyan-500/20" style="background: rgba(30, 41, 59, 0.4);">
          <div class="flex items-center justify-center gap-2 mb-3">
            <i class="${group.icon} text-cyan-400" aria-hidden="true"></i>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">${group.label}</h3>
          </div>
          <div class="text-center mb-3">
            <div class="w-full bg-slate-700/50 rounded-full h-2 mb-2">
              <div class="bg-cyan-500 h-2 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
            </div>
            <p class="text-xs text-gray-400">${completed} / ${totalInGroup} missions completed (${pct}%)</p>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-slate-800/40 rounded-lg p-2 border border-cyan-500/10">
              <p class="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Solo</p>
              <p class="text-sm font-bold font-mono text-white">${completedSolo}/${totalInGroup}</p>
            </div>
            <div class="bg-slate-800/40 rounded-lg p-2 border border-cyan-500/10">
              <p class="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Co-op</p>
              <p class="text-sm font-bold font-mono text-white">${completedCoop}/${totalInGroup}</p>
            </div>
            <div class="bg-slate-800/40 rounded-lg p-2 border border-cyan-500/10">
              <p class="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Best Diff.</p>
              <p class="text-sm font-bold font-mono ${diffLabel === 'Legendary' ? 'text-yellow-400' : diffLabel === 'Heroic' ? 'text-purple-400' : 'text-white'}">${diffLabel}</p>
            </div>
          </div>
        </div>
      `);
    });
  }

  campaignContent.innerHTML = html.join('');
  campaignContent.classList.remove('hidden');
}

function buildModeCard(
  label: string, icon: string,
  completed: number, total: number,
  highestDiff: string,
  timeMs: number
): string {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const timeStr = timeMs > 0 ? parseDuration(`PT${Math.round(timeMs / 1000)}S`) : '0h';

  if (completed === 0 && timeMs === 0) {
    return `
      <div class="rounded-xl p-6 border border-cyan-500/20 text-center" style="background: rgba(30, 41, 59, 0.4);">
        <div class="flex items-center justify-center gap-2 mb-3">
          <i class="${icon} text-cyan-400" aria-hidden="true"></i>
          <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">${label}</h3>
        </div>
        <p class="text-gray-500 text-sm">Not played</p>
      </div>
    `;
  }

  return `
    <div class="rounded-xl p-6 border border-cyan-500/20" style="background: rgba(30, 41, 59, 0.4);">
      <div class="flex items-center justify-center gap-2 mb-4">
        <i class="${icon} text-cyan-400" aria-hidden="true"></i>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">${label}</h3>
      </div>
      <div class="text-center mb-3">
        <div class="w-full bg-slate-700/50 rounded-full h-2.5 mb-2">
          <div class="bg-cyan-500 h-2.5 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
        </div>
        <p class="text-xs text-gray-400">${completed} / ${total} levels completed</p>
      </div>
      <div class="grid grid-cols-2 gap-3 text-center">
        <div class="bg-slate-800/40 rounded-lg p-3 border border-cyan-500/10">
          <p class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Highest Diff.</p>
          <p class="text-lg font-bold font-mono ${highestDiff === 'Legendary' ? 'text-yellow-400' : highestDiff === 'Heroic' ? 'text-purple-400' : 'text-white'}">${highestDiff}</p>
        </div>
        <div class="bg-slate-800/40 rounded-lg p-3 border border-cyan-500/10">
          <p class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Time Played</p>
          <p class="text-lg font-bold font-mono text-white">${timeStr}</p>
        </div>
      </div>
    </div>
  `;
}
