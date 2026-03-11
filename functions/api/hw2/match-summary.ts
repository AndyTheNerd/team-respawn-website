type D1PreparedStatement = {
  bind: (...args: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
  run: () => Promise<unknown>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: unknown[]) => Promise<unknown>;
};

type Env = {
  DB?: D1Database;
  GROQ_API_KEY?: string;
  CEREBRAS_API_KEY?: string;
};

type PlayerSummary = {
  gamertag: string;
  leader: string;
  teamId: number | null;
  unitsDestroyed: number;
  unitsLost: number;
  topPowers: string[];
  techT2Min: number | null;
  techT3Min: number | null;
  firstBuilding: string | null;
  firstUnit: string | null;
};

type MatchContext = {
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

type SummaryCacheRow = {
  summary: string;
  model: string;
};

function formatPlayer(p: PlayerSummary): string {
  const lines: string[] = [`  Leader: ${p.leader} (${p.gamertag})`];
  if (p.unitsDestroyed > 0 || p.unitsLost > 0) lines.push(`  Units: ${p.unitsDestroyed} destroyed / ${p.unitsLost} lost`);
  if (p.firstBuilding) lines.push(`  First building: ${p.firstBuilding}`);
  if (p.firstUnit) lines.push(`  First unit: ${p.firstUnit}`);
  if (p.techT2Min != null) lines.push(`  T2 at: ${p.techT2Min}m`);
  if (p.techT3Min != null) lines.push(`  T3 at: ${p.techT3Min}m`);
  if (p.topPowers.length > 0) lines.push(`  Powers used: ${p.topPowers.join(', ')}`);
  return lines.join('\n');
}

function buildPrompt(gamertag: string, ctx: MatchContext): string {
  const you = ctx.you;
  const completedStr = ctx.completed === false ? ' (left early)' : '';
  const csrLine = ctx.csrDelta ? `\n- CSR change: ${ctx.csrDelta}` : '';

  const opponentBlock = ctx.opponents.length > 0
    ? ctx.opponents.map(formatPlayer).join('\n')
    : '  Unknown';

  const allyBlock = ctx.allies.length > 0
    ? `\nAllies:\n${ctx.allies.map(formatPlayer).join('\n')}`
    : '';

  return `You are a Halo Wars 2 match analyst. Write a 3-4 sentence analysis explaining WHY this match was won or lost, from the perspective of "${gamertag}" (referred to as "you").

Context (do NOT restate these facts — use them to reason about the outcome):
Match: ${ctx.result}${completedStr} | ${ctx.teamSize} ${ctx.playlist} | ${ctx.duration || 'Unknown'} | ${ctx.date || ''}${csrLine}

Your stats:
${formatPlayer(you)}
${allyBlock}
Opponents:
${opponentBlock}

Focus on explaining the reasons behind the ${ctx.result.toLowerCase()} by comparing the data above. Look for:
- Unit destruction differential (who destroyed more / lost more — suggests combat dominance)
- Leader power usage (who used more powers, or specific powers that changed the match)
- Tech speed differential (who hit T2/T3 faster — suggests better economy or aggression)
- Build order (first buildings/units can indicate rush, defensive, or eco strategies)

Rules:
- Do NOT state the result or map name — the player already knows those
- Do NOT use hollow filler: "testament to your skill", "well-played", "incredible", etc.
- Only reference data that is actually present above — do not invent details
- If CSR change is not listed, do not mention ranking
- Plain prose only — no headers, bullets, or labels
- Address "${gamertag}" as "you"`;
}

async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json() as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in Groq response');
  return content.trim();
}

async function callCerebras(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3.1-70b',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    throw new Error(`Cerebras API error: ${response.status}`);
  }

  const data = await response.json() as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in Cerebras response');
  return content.trim();
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
  };

  const url = new URL(request.url);
  const matchId = url.searchParams.get('matchId')?.trim() || '';
  const gamertag = url.searchParams.get('gamertag')?.trim() || '';

  if (!matchId || !gamertag) {
    return new Response(
      JSON.stringify({ error: 'matchId and gamertag are required.' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const gamertagKey = gamertag.toLowerCase();

  // Check D1 cache
  if (env.DB) {
    try {
      const cached = await env.DB
        .prepare('SELECT summary, model FROM match_summaries WHERE match_id = ? AND gamertag = ?')
        .bind(matchId, gamertagKey)
        .first<SummaryCacheRow>();

      if (cached?.summary) {
        return new Response(
          JSON.stringify({ summary: cached.summary, model: cached.model, cached: true }),
          { status: 200, headers: corsHeaders }
        );
      }
    } catch {
      // Cache miss or DB error — continue to generate
    }
  }

  // Parse request body
  let matchContext: MatchContext;
  try {
    matchContext = await request.json() as MatchContext;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (!env.GROQ_API_KEY && !env.CEREBRAS_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'No AI provider configured. Add GROQ_API_KEY or CEREBRAS_API_KEY.' }),
      { status: 503, headers: corsHeaders }
    );
  }

  const prompt = buildPrompt(gamertag, matchContext);
  let summary = '';
  let modelUsed = '';

  // Try Groq first
  if (env.GROQ_API_KEY) {
    try {
      summary = await callGroq(env.GROQ_API_KEY, prompt);
      modelUsed = 'llama-3.3-70b-versatile (Groq)';
    } catch {
      // Fall through to Cerebras
    }
  }

  // Cerebras fallback
  if (!summary && env.CEREBRAS_API_KEY) {
    try {
      summary = await callCerebras(env.CEREBRAS_API_KEY, prompt);
      modelUsed = 'llama3.1-70b (Cerebras)';
    } catch {
      // Both failed
    }
  }

  if (!summary) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate summary. Please try again later.' }),
      { status: 502, headers: corsHeaders }
    );
  }

  // Cache in D1
  if (env.DB) {
    try {
      await env.DB
        .prepare(
          `INSERT INTO match_summaries (match_id, gamertag, summary, model, generated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(match_id, gamertag) DO UPDATE SET
             summary = excluded.summary,
             model = excluded.model,
             generated_at = excluded.generated_at`
        )
        .bind(matchId, gamertagKey, summary, modelUsed, new Date().toISOString())
        .run();
    } catch {
      // Non-fatal — still return the summary
    }
  }

  return new Response(
    JSON.stringify({ summary, model: modelUsed, cached: false }),
    { status: 200, headers: corsHeaders }
  );
};
