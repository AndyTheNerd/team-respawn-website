type D1PreparedStatement = {
  bind: (...args: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
};

type Env = {
  DB?: D1Database;
};

type SearchRow = {
  gamertag: string;
  last_searched: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) {
    return jsonResponse({ searches: [] });
  }

  try {
    const result = await env.DB.prepare(
      `SELECT p.gamertag, MAX(se.searched_at) AS last_searched
       FROM search_events se
       JOIN players p ON se.player_id = p.player_id
       GROUP BY p.player_id, p.gamertag
       ORDER BY last_searched DESC
       LIMIT 12`
    ).all<SearchRow>();

    return jsonResponse({ searches: result.results });
  } catch {
    return jsonResponse({ searches: [] });
  }
};
