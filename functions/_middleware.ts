/**
 * 301 redirect from apex host to www so all traffic and SEO consolidate on one hostname.
 * Runs in front of static assets and Pages Functions (functions/_middleware).
 */
export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
}): Promise<Response> {
  const host = context.request.headers.get('Host')?.split(':')[0]?.toLowerCase();
  if (host === 'teamrespawn.net') {
    const url = new URL(context.request.url);
    url.hostname = 'www.teamrespawn.net';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
