const VIDEO_HOSTS = new Set([
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'www.youtube.com',
  'youtube.com',
]);

const AS = 'https://getvalence.app';

/**
 * Whether a request is going to the host a catalogue trailer is framed from.
 *
 * @param url - Where the request is going.
 * @returns Whether it is the video host.
 */
const isAVideoHost = (url: string): boolean => {
  const asked = URL.parse(url);

  return asked !== null && VIDEO_HOSTS.has(asked.host);
};

/**
 * Says who is framing a trailer, so that the video host's player will play it.
 *
 * The player refuses to start without an ordinary web address to attribute the embed to — error 153
 * is what that refusal looks like. In a browser it gets one for nothing, because the page is served
 * over http. This client serves its own pages from its own scheme, so there is no such address to
 * send and the player stops.
 *
 * What is sent is Valence's own address rather than the server's. The server's is the viewer's, and
 * it is nobody else's business which machine somebody keeps their films on; naming the application
 * answers the only question the player is actually asking, which is what is doing the embedding.
 *
 * Only who is asking, and nothing about where from. Writing an origin here as well is what makes a
 * player that has started sit at nothing for ever: the requests it then makes for the picture itself
 * are cross-origin and carry an origin of their own, and replacing that with ours is a request the
 * host will not answer.
 *
 * @param headers - The headers the request was going to carry.
 * @returns Them, with Valence named.
 */
const nameValenceToTheVideoHost = (headers: Record<string, string>): Record<string, string> => ({
  ...headers,
  Referer: `${AS}/`,
});

export { isAVideoHost, nameValenceToTheVideoHost, AS };
