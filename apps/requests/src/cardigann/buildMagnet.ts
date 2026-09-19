const PUBLIC_TRACKERS: readonly string[] = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://exodus.desync.com:6969/announce',
  'udp://explodie.org:6969/announce',
  'udp://open.demonii.com:1337/announce',
];

/**
 * Builds a magnet link for a public release from its info hash and title, with a few long-lived
 * public trackers so that it can find peers without the site.
 *
 * @param infoHash - The torrent's info hash.
 * @param title - What to call it.
 * @returns The magnet link.
 */
const buildMagnet = (infoHash: string, title: string): string =>
  `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}${PUBLIC_TRACKERS.map(
    (tracker) => `&tr=${encodeURIComponent(tracker)}`,
  ).join('')}`;

export { buildMagnet };
