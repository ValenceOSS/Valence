/**
 * Where a calendar app reached this server, for links in the feed back to the calendar: the address
 * it asked for, with the scheme a reverse proxy in front of the server says it was asked over.
 *
 * @param url - The address the feed was asked for at, as this server saw it.
 * @param headers - The request's headers.
 * @returns The origin, with no path.
 */
const feedOriginOf = (url: string, headers: Headers): string => {
  const asked = new URL(url);
  const scheme = headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const host = headers.get('x-forwarded-host')?.split(',')[0]?.trim() ?? asked.host;

  return `${scheme === 'https' || scheme === 'http' ? scheme : asked.protocol.slice(0, -1)}://${host}`;
};

export { feedOriginOf };
