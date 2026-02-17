import { state } from './state';
import { parseDuration, getGameModeName, findMatchPlayer } from './dataProcessing';
import { getLeaderName } from '../../data/haloWars2/leaders';
import { getMapName } from '../../data/haloWars2/maps';
import { getPlaylistName } from '../../data/haloWars2/playlists';
import { getMatchResult } from '../../utils/haloApi';
import { fetchMatchEventsPayload, buildEventEntries } from './matchEventProcessing';
import { ensureLeaderPowerMap, getLeaderPowerDisplayName } from './apiCache';

// --- SheetJS lazy loader ---

let xlsxPromise: Promise<any> | null = null;

function ensureXlsx(): Promise<any> {
  const existing = (window as any).XLSX;
  if (existing) return Promise.resolve(existing);
  if (xlsxPromise) return xlsxPromise;
  xlsxPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.async = true;
    script.onload = () => resolve((window as any).XLSX);
    script.onerror = () => reject(new Error('Failed to load spreadsheet library'));
    document.head.appendChild(script);
  });
  return xlsxPromise;
}

// --- Sheet helpers ---

type SheetRow = (string | number)[];

function buildSheet(XLSX: any, headers: string[], rows: SheetRow[]) {
  return XLSX.utils.aoa_to_sheet([headers, ...rows]);
}

function triggerXlsxDownload(XLSX: any, workbook: any, filename: string) {
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- CSV helpers (for Export All, which stays as CSV) ---

function escCsv(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsvRow(cells: string[]): string {
  return cells.map(escCsv).join(',');
}

function triggerCsvDownload(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- Match export (multi-sheet XLSX) ---

export async function exportMatchToCsv(matchId: string, gamertag: string) {
  const match = state.matchLookup.get(matchId);
  if (!match) return;

  const XLSX = await ensureXlsx();

  const mapName = getMapName(match.MapId || '');
  const playlistName = match.PlaylistId ? getPlaylistName(match.PlaylistId) : '';
  const modeName = getGameModeName(match.GameMode) || (match.MatchType === 3 ? 'Matchmaking' : 'Unknown');
  const playlistLabel = playlistName || modeName;
  const dateStr = match.MatchStartDate?.ISO8601Date
    ? new Date(match.MatchStartDate.ISO8601Date).toISOString()
    : '';
  const durationIso = match.PlayerMatchDuration || match.MatchDuration;
  const durationStr = durationIso ? parseDuration(durationIso) : '';

  const wb = XLSX.utils.book_new();

  // --- Sheet 1: Match Overview ---
  const overviewSheet = buildSheet(XLSX,
    ['Match ID', 'Map', 'Playlist', 'Date', 'Duration'],
    [[matchId, mapName, playlistLabel, dateStr, durationStr]]
  );
  XLSX.utils.book_append_sheet(wb, overviewSheet, 'Match Overview');

  // --- Sheet 2: Team Compositions (from full match result) ---
  const matchResult = await getMatchResult(matchId);
  const leaderPowerMap = await ensureLeaderPowerMap();

  if (matchResult.ok) {
    const playersRaw = matchResult.data?.Players;
    const players = Array.isArray(playersRaw)
      ? playersRaw
      : (playersRaw && typeof playersRaw === 'object')
        ? Object.values(playersRaw)
        : [];

    const teamRows: SheetRow[] = [];
    const powerRows: SheetRow[] = [];

    players.forEach((p: any) => {
      if (p.PlayerType === 3) return;
      const playerName = p?.HumanPlayerId?.Gamertag
        || p?.Gamertag
        || (typeof p?.HumanPlayerId === 'string' ? p.HumanPlayerId : '')
        || (p?.ComputerPlayerId != null ? `AI ${p.ComputerPlayerId}` : 'Unknown');
      const leaderName = getLeaderName(p.LeaderId);
      const teamLabel = p.TeamId != null ? `Team ${p.TeamId}` : 'Unknown';
      const outcome = p.MatchOutcome === 1 ? 'Win' : p.MatchOutcome === 2 ? 'Loss' : 'Draw';

      let destroyed = 0;
      let lost = 0;
      if (p.UnitStats && typeof p.UnitStats === 'object') {
        Object.values(p.UnitStats).forEach((u: any) => {
          destroyed += u?.TotalDestroyed || 0;
          lost += u?.TotalLost || 0;
        });
      }

      let powersUsed = 0;
      if (p.LeaderPowerStats && typeof p.LeaderPowerStats === 'object') {
        Object.values(p.LeaderPowerStats).forEach((stats: any) => {
          powersUsed += typeof stats === 'number' ? stats : (stats?.TimesCast ?? stats?.TotalPlays ?? 0);
        });
      }

      teamRows.push([teamLabel, playerName, leaderName, outcome, destroyed, lost, powersUsed]);

      // Collect leader powers for the powers sheet
      if (p.LeaderPowerStats && typeof p.LeaderPowerStats === 'object') {
        Object.entries(p.LeaderPowerStats)
          .map(([powerId, stats]) => ({
            name: getLeaderPowerDisplayName(powerId, leaderPowerMap),
            times: typeof stats === 'number' ? stats : ((stats as any)?.TimesCast ?? (stats as any)?.TotalPlays ?? 0),
          }))
          .filter(pwr => pwr.times > 0)
          .sort((a, b) => b.times - a.times)
          .forEach(pwr => {
            powerRows.push([playerName, pwr.name, pwr.times]);
          });
      }
    });

    const teamSheet = buildSheet(XLSX,
      ['Team', 'Player', 'Leader', 'Outcome', 'Units Destroyed', 'Units Lost', 'Leader Powers Used'],
      teamRows
    );
    XLSX.utils.book_append_sheet(wb, teamSheet, 'Team Composition & Stats');

    // --- Sheet 3: Leader Powers Detail ---
    const powersSheet = buildSheet(XLSX,
      ['Player', 'Power Name', 'Times Cast'],
      powerRows
    );
    XLSX.utils.book_append_sheet(wb, powersSheet, 'Leader Powers Detail');
  }

  // --- Sheet 4: Build Order Events ---
  const eventsResult = await fetchMatchEventsPayload(matchId);
  if (eventsResult.ok) {
    const { entries } = await buildEventEntries(eventsResult.data);
    if (entries.length > 0) {
      const sorted = [...entries].sort((a, b) => a.timeMs - b.timeMs);
      const eventRows: SheetRow[] = sorted.map(entry => {
        const mins = Math.floor(entry.timeMs / 60000);
        const secs = Math.floor((entry.timeMs % 60000) / 1000);
        const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
        const playerName = entry.playerName || 'Unknown';
        const teamLabel = entry.teamId != null ? `Team ${entry.teamId}` : '';
        const techTier = entry.techTier ? `Tech ${entry.techTier}` : '';
        return [timeStr, playerName, teamLabel, entry.kind, entry.label, techTier];
      });

      const eventsSheet = buildSheet(XLSX,
        ['Time', 'Player', 'Team', 'Event Type', 'Item', 'Tech Tier'],
        eventRows
      );
      XLSX.utils.book_append_sheet(wb, eventsSheet, 'Build Order Events');

      const resourceRows: SheetRow[] = sorted
        .filter((entry) => entry.kind === 'resource')
        .filter((entry) => Number.isFinite(Number(entry.supply)) || Number.isFinite(Number(entry.energy)))
        .map((entry) => {
          const mins = Math.floor(entry.timeMs / 60000);
          const secs = Math.floor((entry.timeMs % 60000) / 1000);
          const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
          const playerName = entry.playerName || 'Unknown';
          const teamLabel = entry.teamId != null ? `Team ${entry.teamId}` : '';
          const supply = Number.isFinite(Number(entry.supply)) ? Number(entry.supply) : '';
          const power = Number.isFinite(Number(entry.energy)) ? Number(entry.energy) : '';
          return [timeStr, playerName, teamLabel, supply, power];
        });

      if (resourceRows.length > 0) {
        const resourcesSheet = buildSheet(XLSX,
          ['Time', 'Player', 'Team', 'Supply', 'Power'],
          resourceRows
        );
        XLSX.utils.book_append_sheet(wb, resourcesSheet, 'Resource Timeline');
      }
    }
  }

  const safeGamertag = gamertag.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = dateStr ? new Date(dateStr).toISOString().slice(0, 10) : 'unknown';
  triggerXlsxDownload(XLSX, wb, `HW2_Match_${safeGamertag}_${safeDate}_${matchId.slice(0, 8)}.xlsx`);
}

export function exportAllMatchesToCsv(gamertag: string) {
  const matches = state.currentMatches;
  if (!matches || matches.length === 0) return;

  const rows: string[] = [];
  rows.push(buildCsvRow(['Match ID', 'Date', 'Map', 'Leader', 'Playlist', 'Duration', 'Result', 'Team Size']));

  matches.forEach((match: any) => {
    const player = findMatchPlayer(match, gamertag);
    const rawOutcome = player?.MatchOutcome ?? match.PlayerMatchOutcome;
    const result = rawOutcome === 1 ? 'Win' : rawOutcome === 2 ? 'Loss' : 'Draw';
    const leaderId = player?.LeaderId ?? match.LeaderId;
    const leaderName = leaderId != null ? getLeaderName(leaderId) : 'Unknown';
    const mapName = getMapName(match.MapId || '');
    const playlistName = match.PlaylistId ? getPlaylistName(match.PlaylistId) : getGameModeName(match.GameMode) || '';
    const dateStr = match.MatchStartDate?.ISO8601Date || '';
    const durationIso = match.PlayerMatchDuration || match.MatchDuration;
    const durationStr = durationIso ? parseDuration(durationIso) : '';

    let teamSizeLabel = '';
    if (match.Teams && typeof match.Teams === 'object') {
      const sizes = Object.values(match.Teams).map((t: any) => t?.TeamSize).filter((s: any) => typeof s === 'number');
      if (sizes.length >= 2) teamSizeLabel = `${sizes[0]}v${sizes[1]}`;
    }

    rows.push(buildCsvRow([match.MatchId || '', dateStr, mapName, leaderName, playlistName, durationStr, result, teamSizeLabel]));
  });

  const csv = rows.join('\n');
  const safeGamertag = gamertag.replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerCsvDownload(csv, `HW2_Matches_${safeGamertag}_${new Date().toISOString().slice(0, 10)}.csv`);
}
