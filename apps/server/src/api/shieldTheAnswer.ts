const DRAWING = 'image/svg+xml';

const DRAWING_POLICY = "default-src 'none'; style-src 'unsafe-inline'; sandbox";

/**
 * Sets the headers every answer this server gives carries, whatever answered it. It names no page it
 * came from and asks not to be indexed, as a private server should; it is never to be read as a
 * different kind of file than it says, so a picture somebody uploaded cannot be run as a page; it may
 * be framed only by this server's own pages, so another site cannot lay it under a click; and a
 * drawing — an SVG, which a browser will run scripts in when opened on its own — is sandboxed, unless
 * whatever answered set a policy of its own.
 *
 * @param headers - The answer's headers, changed in place.
 */
const shieldTheAnswer = (headers: Headers): void => {
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('X-Content-Type-Options', 'nosniff');

  if (!headers.has('X-Frame-Options')) {
    headers.set('X-Frame-Options', 'SAMEORIGIN');
  }

  if (
    (headers.get('content-type') ?? '').startsWith(DRAWING) &&
    !headers.has('Content-Security-Policy')
  ) {
    headers.set('Content-Security-Policy', DRAWING_POLICY);
  }
};

export { shieldTheAnswer };
