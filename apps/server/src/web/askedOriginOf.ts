/**
 * Where somebody reached this server, for a link that has to lead back to it, such as a calendar
 * feed's links to the calendar or the phone app's link to the server: the address they asked for,
 * with the scheme and host a reverse proxy in front of the server says they asked with.
 *
 * @param url - The address that was asked for, as this server saw it.
 * @param headers - The request's headers.
 * @returns The origin, with no path.
 */
const askedOriginOf = (url: string, headers: Headers): string => {
  const asked = new URL(url);
  const scheme = headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const host = headers.get('x-forwarded-host')?.split(',')[0]?.trim() ?? asked.host;

  return `${scheme === 'https' || scheme === 'http' ? scheme : asked.protocol.slice(0, -1)}://${host}`;
};

export { askedOriginOf };
