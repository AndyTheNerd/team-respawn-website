import {
  Env, TournamentRow, ParticipantRow, TournamentMatchRow,
  jsonResponse, errorResponse, isExpired, validateTournamentId, parseBracketData,
} from '../_shared';

// ── GET /api/tournaments/:id ──────────────────────────────────────────────────
// Returns the full tournament record, participant list, and per-match metadata.
// bracket_data is parsed from JSON so the client can feed it directly to brackets-viewer.
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  if (!env.DB) return errorResponse('Database unavailable', 503);

  const id = params.id as string;
  if (!validateTournamentId(id)) return errorResponse('Tournament not found', 404);

  const tournament = await env.DB.prepare(
    'SELECT * FROM tournaments WHERE id = ?'
  ).bind(id).first<TournamentRow>();

  if (!tournament) return errorResponse('Tournament not found', 404);
  if (isExpired(tournament)) return errorResponse('This tournament has expired', 410);

  const [participantsResult, matchesResult] = await Promise.all([
    env.DB.prepare(
      'SELECT id, gamertag, joined_at FROM tournament_participants WHERE tournament_id = ? ORDER BY joined_at ASC'
    ).bind(id).all<Pick<ParticipantRow, 'id' | 'gamertag' | 'joined_at'>>(),
    env.DB.prepare(
      'SELECT * FROM tournament_matches WHERE tournament_id = ? ORDER BY brackets_match_id ASC'
    ).bind(id).all<TournamentMatchRow>(),
  ]);

  const bracketData = parseBracketData(tournament.bracket_data);

  return jsonResponse({
    tournament: {
      id: tournament.id,
      name: tournament.name,
      organizer_name: tournament.organizer_name,
      format: tournament.format,
      status: tournament.status,
      is_private: tournament.join_password_hash !== null,
      max_participants: tournament.max_participants,
      created_at: tournament.created_at,
      expires_at: tournament.expires_at,
      bracket_data: bracketData,
    },
    participants: participantsResult.results,
    matches: matchesResult.results,
  });
};
