const WATCHING = 3;

const LISTENING = 2;

const LOGO = 'valence-desktop';

const VALENCE = 'Valence';

const BROWSING = 'Browsing the library';

const ARTWORK_HOST = 'image.tmdb.org';

const PAUSED = 'Paused';

const BETWEEN = ' · ';

const A_SECOND = 1000;

type WhatIsPlaying =
  | {
      kind: 'watching';
      title: string;
      series: string | null;
      season: number | null;
      episode: number | null;
      startedAt: number;
      endsAt: number | null;
      tmdbId: string | null;
      isSeries: boolean;
      isPaused: boolean;
      artwork: string | null;
      party: { id: string; size: number } | null;
    }
  | {
      kind: 'listening';
      title: string;
      artists: string[];
      startedAt: number;
      endsAt: number | null;
      isPaused: boolean;
      artwork: string | null;
      party: { id: string; size: number } | null;
    }
  | { kind: 'browsing' };

type DiscordActivity = {
  type: number;
  name?: string;
  details: string;
  state?: string;
  timestamps?: { start: number; end?: number };
  assets: {
    large_image: string;
    large_text: string;
    small_image?: string;
    small_text?: string;
  };
  party?: { id: string; size: [number, number] };
  buttons?: { label: string; url: string }[];
};

/**
 * Says what the small picture over the corner of a track's own cover means, once somebody rests on
 * it.
 *
 * Only a track wears this badge. Watching and browsing already draw the Valence logo large and
 * plain, and a badge over a logo is the platform naming itself twice in the one status that already
 * says which one this is — the badge over a cover earns its place by telling somebody apart what a
 * plain picture cannot: whether the thing under it is actually moving.
 *
 * @param isPaused - Whether the track has stopped.
 * @returns What the badge says when somebody rests on it.
 */
const theBadgeTextFor = (isPaused: boolean): string => (isPaused ? 'Paused' : 'Playing');

/**
 * Says how many other people are watching this together.
 *
 * Discord has a group of its own, and it is sent, but it draws it only on an activity that says
 * somebody is playing something. This one says they are watching, which is what it is — so the
 * company goes in the line somebody reads rather than in a field they will never see.
 *
 * @param party - The watch party, where there is one.
 * @returns What to say about the company, or nothing where somebody is watching alone.
 */
const theCompanyIn = (party: { id: string; size: number } | null): string | null => {
  if (party === null || party.size < 2) {
    return null;
  }

  const others = party.size - 1;

  return others === 1 ? 'with 1 other' : `with ${others.toString()} others`;
};

/**
 * Names who made a track the way somebody would say it aloud, rather than the way a database lists
 * it.
 *
 * @param artists - The names on the track, in the catalogue's own order.
 * @returns The names joined for reading, or nothing where the catalogue named nobody.
 */
const theArtistsIn = (artists: string[]): string | null => {
  if (artists.length === 0) {
    return null;
  }

  if (artists.length === 1) {
    return artists[0] ?? null;
  }

  const last = artists[artists.length - 1];
  const rest = artists.slice(0, -1);

  return `${rest.join(', ')} & ${last}`;
};

/**
 * Builds the line under the details, combining what is playing with who it is playing with and
 * whether it has stopped, in the one order Discord draws them.
 *
 * @param line - What is playing, where there is a line of its own to say it on.
 * @param party - The party, where there is one.
 * @param isPaused - Whether it is stopped.
 * @returns The line to draw, or nothing where there is nothing to say.
 */
const theStateLine = (
  line: string | null,
  party: { id: string; size: number } | null,
  isPaused: boolean,
): string | undefined => {
  const together = theCompanyIn(party);
  const body = [line, together].filter((part) => part !== null).join(BETWEEN);
  const said = body === '' ? null : body;

  return (isPaused ? (said === null ? PAUSED : `${PAUSED} — ${said}`) : said) ?? undefined;
};

/**
 * The picture to draw large for something watched, where there is one Discord can fetch and it is
 * safe to name.
 *
 * Discord draws artwork from a registered asset or from a URL it proxies for itself, which means the
 * address is fetched by Discord rather than by whoever sees the status. It is still an address this
 * client publishes, so only the catalogue's own image host is allowed: a library on somebody's own
 * machine is not reachable from the internet anyway, and naming it would tell a room full of people
 * where somebody's server is.
 *
 * @param artwork - The address the page offered, where it offered one.
 * @returns The picture to draw, or nothing to fall back to the logo.
 */
const theArtworkFor = (artwork: string | null): string | undefined => {
  if (artwork === null) {
    return undefined;
  }

  const asked = URL.parse(artwork);

  return asked !== null && asked.protocol === 'https:' && asked.hostname === ARTWORK_HOST
    ? artwork
    : undefined;
};

/**
 * The picture to draw large for a track, on the same terms as {@link theArtworkFor} but without the
 * one restriction that does not apply to it.
 *
 * A film's poster comes from TMDB, a public host anybody could already be pointed at — an album's
 * cover comes from the server playing it, which this profile chose to publish the address of the
 * moment it asked to show what it is playing at all. There is no host left worth naming here, only
 * the one already named by every other line on the card.
 *
 * @param artwork - The address the page offered, where it offered one.
 * @returns The picture to draw, or nothing to fall back to the logo.
 */
const theTracksArtworkFor = (artwork: string | null): string | undefined => {
  if (artwork === null) {
    return undefined;
  }

  const asked = URL.parse(artwork);

  return asked !== null && asked.protocol === 'https:' ? artwork : undefined;
};

/**
 * Writes what somebody is watching the way Discord shows it.
 *
 * The programme goes on the top line and the episode below it, because that is the order Discord
 * draws them in and the order somebody would say them. A film has only the top line.
 *
 * The times are sent rather than a progress figure, so Discord's own clock counts down without Valence
 * telling it anything again — a presence that had to be pushed every second would be a presence that
 * stutters whenever the machine is busy.
 *
 * The poster is not sent. Discord draws artwork only from images registered against the application
 * in advance, and a self-hosted library's posters are neither registered nor reachable from the
 * internet — sending a URL to one would either fail or publish somebody's server address. The Valence
 * logo is what is left, and it is the honest answer rather than a compromise.
 *
 * Somebody who has Valence open but is not watching anything gets the top line and the logo and nothing
 * else. No clock, because there is nothing to count towards, and no button, because there is nothing
 * in particular to send anybody to.
 *
 * The poster is drawn where the catalogue has one, because it is what somebody would recognise from
 * across a room. Discord fetches it for itself rather than passing the address on, and only the
 * catalogue's own image host is named — a self-hosted library is not reachable from the internet,
 * and its address is nobody else's business. The logo stands in where there is no poster.
 *
 * A pause takes the clock off rather than freezing it. Discord counts from the times it was given
 * and has no notion of being stopped, so a paused status left with them would go on counting towards
 * an end that is no longer coming — better to say what is open and let the missing clock say the
 * rest.
 *
 * A watch party is said in the line somebody reads, and sent as Discord's own group besides. The
 * group is the field made for it, but Discord draws it only where an activity says somebody is
 * playing something, and this one says they are watching — which is worth more than the little
 * figure, because it is what the card leads with. The field is still sent: it is true, it costs
 * nothing, and wherever Discord does draw it, it will be right.
 *
 * Listening is named after who made the track rather than after Valence, the way the badge over an
 * artist's own picture would be — Discord draws the header from the activity's own name where one is
 * given, and the honest header for a song is who is singing it, not which application is playing it.
 *
 * @param playing - What is happening, or nothing where the status should come down.
 * @returns The activity to send, or nothing to clear it.
 */
const aDiscordActivity = (playing: WhatIsPlaying | null): DiscordActivity | null => {
  if (playing === null) {
    return null;
  }

  if (playing.kind === 'browsing') {
    return {
      type: WATCHING,
      details: BROWSING,
      assets: { large_image: LOGO, large_text: VALENCE },
    };
  }

  const timestamps = playing.isPaused
    ? {}
    : {
        timestamps: {
          start: Math.floor(playing.startedAt / A_SECOND),
          ...(playing.endsAt === null ? {} : { end: Math.floor(playing.endsAt / A_SECOND) }),
        },
      };
  const party: Pick<DiscordActivity, 'party'> =
    playing.party === null
      ? {}
      : { party: { id: playing.party.id, size: [playing.party.size, playing.party.size] } };

  if (playing.kind === 'listening') {
    const artists = theArtistsIn(playing.artists);
    const state = theStateLine(artists, playing.party, playing.isPaused);

    return {
      type: LISTENING,
      ...(artists === null ? {} : { name: artists }),
      details: playing.title,
      ...(state === undefined ? {} : { state }),
      ...timestamps,
      assets: {
        large_image: theTracksArtworkFor(playing.artwork) ?? LOGO,
        large_text: VALENCE,
        small_image: LOGO,
        small_text: theBadgeTextFor(playing.isPaused),
      },
      ...party,
    };
  }

  const assets = { large_image: theArtworkFor(playing.artwork) ?? LOGO, large_text: VALENCE };

  const episode =
    typeof playing.season === 'number' && typeof playing.episode === 'number'
      ? `Series ${playing.season.toString()}, Episode ${playing.episode.toString()}`
      : null;

  const tmdb =
    playing.tmdbId === null
      ? null
      : {
          label: 'View on TMDB',
          url: `https://www.themoviedb.org/${playing.isSeries ? 'tv' : 'movie'}/${playing.tmdbId}`,
        };

  const line = playing.series === null ? null : (episode ?? playing.title);
  const state = theStateLine(line, playing.party, playing.isPaused);

  return {
    type: WATCHING,
    details: playing.series ?? playing.title,
    ...(state === undefined ? {} : { state }),
    ...timestamps,
    assets,
    ...party,
    ...(tmdb === null ? {} : { buttons: [tmdb] }),
  };
};

export type { DiscordActivity, WhatIsPlaying };

export { aDiscordActivity };
