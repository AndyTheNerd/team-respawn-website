const DAILY_HIGH_TIMEZONE = 'America/New_York';
const HISTORY_DAYS = 30;

type D1PreparedStatement = {
  bind: (...args: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
};

type Env = {
  DB?: D1Database;
};

type DailySummaryRow = {
  sample_day: string;
  peak_players: number;
  peak_sampled_at: string;
  sample_count: number;
};

type TrackingStartRow = {
  first_day: string | null;
};

type HistoryDay = {
  day: string;
  observedDailyHigh: number | null;
  sampledAt: string | null;
  sampleCount: number;
  hasData: boolean;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
}

function getDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return [year, month, day].filter(Boolean).join('-');
}

function buildDateRange(endDay: string, totalDays: number) {
  const [year, month, day] = endDay.split('-').map(Number);
  const endUtc = Date.UTC(year, month - 1, day);
  return Array.from({ length: totalDays }, (_, index) => {
    const offset = totalDays - 1 - index;
    const date = new Date(endUtc - offset * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10);
  });
}

function buildEmptyHistory(days: string[]) {
  const series: HistoryDay[] = days.map((sampleDay) => ({
    day: sampleDay,
    observedDailyHigh: null,
    sampledAt: null,
    sampleCount: 0,
    hasData: false,
  }));

  return {
    timezone: DAILY_HIGH_TIMEZONE,
    requestedDays: HISTORY_DAYS,
    availableDays: 0,
    trackingStartedAt: null,
    days: series,
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = getDateKey(new Date(), DAILY_HIGH_TIMEZONE);
  const days = buildDateRange(today, HISTORY_DAYS);
  const firstDay = days[0];
  const emptyHistory = buildEmptyHistory(days);

  if (!env.DB) {
    return jsonResponse(emptyHistory);
  }

  try {
    const [rowsResult, trackingStart] = await Promise.all([
      env.DB.prepare(
        `SELECT sample_day, peak_players, peak_sampled_at, sample_count
         FROM hwde_steam_daily_summary
         WHERE sample_day >= ? AND sample_day <= ?
         ORDER BY sample_day ASC`
      ).bind(firstDay, today).all<DailySummaryRow>(),
      env.DB.prepare(
        'SELECT MIN(sample_day) AS first_day FROM hwde_steam_daily_summary'
      ).first<TrackingStartRow>(),
    ]);

    const rowsByDay = new Map(rowsResult.results.map((row) => [row.sample_day, row]));
    const series = days.map((sampleDay) => {
      const row = rowsByDay.get(sampleDay);
      return {
        day: sampleDay,
        observedDailyHigh: typeof row?.peak_players === 'number' ? row.peak_players : null,
        sampledAt: row?.peak_sampled_at ?? null,
        sampleCount: typeof row?.sample_count === 'number' ? row.sample_count : 0,
        hasData: Boolean(row),
      };
    });

    return jsonResponse({
      timezone: DAILY_HIGH_TIMEZONE,
      requestedDays: HISTORY_DAYS,
      availableDays: series.filter((day) => day.hasData).length,
      trackingStartedAt: trackingStart?.first_day ?? null,
      days: series,
    });
  } catch (error) {
    console.error('Failed to load Halo Wars DE Steam history.', error);
    return jsonResponse({
      ...emptyHistory,
      degraded: true,
    });
  }
};
