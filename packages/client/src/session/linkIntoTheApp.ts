import { tidyTheCode } from '@ValenceClient/session/tidyTheCode';

/**
 * The link that opens the Valence app on a phone at the same place somebody is on the web: signing
 * a television in, where they are approving one, and otherwise simply the app. The server rides
 * along, so the app can tell whether it is the one it already uses.
 *
 * A link of the app's own rather than a web address, because a web address can only open an app
 * when a domain vouches for it, and a server of somebody's own choosing has no way to vouch for an
 * app it has never heard of — nothing here asks anybody but that server.
 *
 * @param place - Where they are: the code a television is waiting on, or nowhere in particular.
 * @param server - The address of the server the page came from.
 * @returns The link.
 */
const linkIntoTheApp = (place: { televisionCode: string | null }, server: string): string => {
  const from = `server=${encodeURIComponent(server)}`;
  const code = place.televisionCode === null ? '' : tidyTheCode(place.televisionCode);

  return code === ''
    ? `valence://open?${from}`
    : `valence://device?user_code=${encodeURIComponent(code)}&${from}`;
};

export { linkIntoTheApp };
