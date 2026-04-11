import { BracketsManager } from 'brackets-manager';
import { InMemoryDatabase } from '../_storage';
import {
  Env, TournamentRow, ParticipantRow,
  jsonResponse, errorResponse, isExpired,
  verifyAdminPassword, validateTournamentId,
} from '../_shared';

// ── POST /api/tournaments/:id/start ──────────────────────────────────────────
// Body: { adminPassword }
// Seeds the bracket from registered participants, transitions status to 'active'.
export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!env.DB) return errorResponse('Database unavailable', 503);

  const id = params.id as string;
  if (!validateTournamentId(id)) return errorResponse('Tournament not found', 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const adminPassword = typeof body.adminPassword === 'string' ? body.adminPassword.trim() : '';
  if (!adminPassword) return errorResponse('adminPassword is required', 401);

  const tournament = await env.DB.prepare(
    'SELECT * FROM tournaments WHERE id = ?'
  ).bind(id).first<TournamentRow>();

  if (!tournament) return errorResponse('Tournament not found', 404);
  if (isExpired(tournament)) return errorResponse('This tournament has expired', 410);
  if (!tournament.admin_password_hash) return errorResponse('Admin password not configured', 400);
  if (!(await verifyAdminPassword(adminPassword, tournament.admin_password_hash))) {
    return errorResponse('Incorrect admin password', 403);
  }
  if (tournament.status !== 'registration') {
    return errorResponse('Tournament has already started');
  }

  const participantsResult = await env.DB.prepare(
    'SELECT id, gamertag FROM tournament_participants WHERE tournament_id = ? ORDER BY joined_at ASC'
  ).bind(id).all<Pick<ParticipantRow, 'id' | 'gamertag'>>();

  const participants = participantsResult.results;
  if (participants.length < 2) {
    return errorResponse('Need at least 2 participants to start');
  }

  const db = new InMemoryDatabase();
  const manager = new BracketsManager(db);

  await manager.create.stage({
    name: tournament.name,
    tournamentId: 0,
    type: tournament.format,
    seeding: participants.map(p => p.gamertag),
    settings: {
      balanceByes: true,
      consolationFinal: false,
    },
  });

  const bracketData = JSON.stringify(db.content);

  await env.DB.prepare(
    "UPDATE tournaments SET status = 'active', bracket_data = ? WHERE id = ?"
  ).bind(bracketData, id).run();

  return jsonResponse({ ok: true, bracket_data: db.content });
};
