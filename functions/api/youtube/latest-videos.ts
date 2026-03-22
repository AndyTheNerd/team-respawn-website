type Env = {
  YOUTUBE_CHANNEL_ID?: string;
};

type VideoEntry = {
  videoId: string;
  title: string;
  published: string;
  thumbnail: string;
  url: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const channelId = env.YOUTUBE_CHANNEL_ID;
  if (!channelId) {
    return jsonResponse({ videos: [], error: 'YouTube channel not configured' });
  }

  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl, {
      headers: { Accept: 'application/xml, text/xml, */*' },
    });

    if (!response.ok) {
      return jsonResponse({ videos: [], error: 'Failed to fetch YouTube feed' });
    }

    const xml = await response.text();
    const videos: VideoEntry[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? '';
      const rawTitle = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '';
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? '';
      const thumbnail =
        entry.match(/<media:thumbnail url="([^"]+)"/)?.[1] ??
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      if (!videoId) continue;

      videos.push({
        videoId,
        title: unescapeXml(rawTitle.trim()),
        published,
        thumbnail,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    return jsonResponse({ videos: videos.slice(0, 6) });
  } catch {
    return jsonResponse({ videos: [], error: 'Internal error' });
  }
};
