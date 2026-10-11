import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { headersFor } from './headersFor';
import { FINAL_ADDRESS } from './FINAL_ADDRESS';

const LINKS_LAST_MS = 6 * 60 * 60 * 1000;

const WAITS_MS = 20_000;

const URI_ATTRIBUTE = /URI="([^"]+)"/gu;

type RelayAsk = { channelId: string; address: string; until: number; signature: string };

/**
 * Plays a channel's HLS stream through this server: the playlist is fetched from the provider and
 * every address in it — each quality, each segment, each key — is turned into a link back here, so
 * the browser never talks to the provider, never sees its address or credentials, and is never
 * refused by it for asking from another site.
 *
 * A DASH manifest, whose segments are numbered by the player as it goes, cannot have each of their
 * addresses signed ahead of time, so it is given one base address here instead, signed for the
 * manifest's own directory on the provider, and the player builds every segment's address under it.
 * A quality a broadcaster lists twice under one id, as the BBC does, is kept once, since the player
 * refuses a manifest that names two qualities alike.
 *
 * Each link is signed for its channel and lasts a few hours, and the playlists a player keeps
 * fetching hand it fresh ones, so this is never a way to fetch any address through the server — only
 * the ones a channel's own playlist named.
 *
 * A channel that insists on a particular user agent or referrer is asked with it, as its playlist
 * said to.
 *
 * @param now - The clock, in milliseconds.
 * @returns The relay.
 */
const createLiveRelay = (now: () => number = Date.now) => {
  const secret = randomBytes(32);

  const signatureOf = (channelId: string, address: string, until: number): string =>
    createHmac('sha256', secret)
      .update(`${channelId}\n${address}\n${until.toString()}`)
      .digest('base64url');

  const linkFor = (channelId: string, address: string): string => {
    const until = now() + LINKS_LAST_MS;
    const query = new URLSearchParams({
      u: Buffer.from(address).toString('base64url'),
      e: until.toString(),
      s: signatureOf(channelId, address, until),
    });

    return `/api/live/relay/${encodeURIComponent(channelId)}?${query.toString()}`;
  };

  const directoryLinkFor = (channelId: string, directory: string): string => {
    const until = now() + LINKS_LAST_MS;
    const signature = signatureOf(channelId, `directory:${directory}`, until);

    return `/api/live/relayed/${encodeURIComponent(channelId)}/${Buffer.from(directory).toString('base64url')}.${until.toString()}.${signature}/`;
  };

  const dashRewritten = (channelId: string, manifest: string, base: string): string => {
    const directoryOf = (address: string) => new URL('.', new URL(address, base)).toString();
    const seen = new Set<string>();
    const deduplicated = manifest.replace(
      /<Representation\b[^>]*?\bid="([^"]*)"[^>]*?(?:\/>|>[\s\S]*?<\/Representation>)/gu,
      (whole: string, id: string) => {
        if (seen.has(id)) {
          return '';
        }

        seen.add(id);

        return whole;
      },
    );
    const located = deduplicated.replace(
      /<Location>([^<]+)<\/Location>/gu,
      (_, address: string) =>
        `<Location>${linkFor(channelId, new URL(address.trim(), base).toString())}</Location>`,
    );

    if (/<BaseURL[^>]*>/u.test(located)) {
      return located.replace(
        /(<BaseURL[^>]*>)([^<]*)(<\/BaseURL>)/gu,
        (_, open: string, address: string, close: string) =>
          `${open}${directoryLinkFor(channelId, directoryOf(address.trim() === '' ? base : address.trim()))}${close}`,
      );
    }

    return located.replace(
      /(<MPD\b[^>]*>)/u,
      `$1<BaseURL>${directoryLinkFor(channelId, directoryOf(base))}</BaseURL>`,
    );
  };

  const isSigned = ({ channelId, address, until, signature }: RelayAsk): boolean => {
    const expected = Buffer.from(signatureOf(channelId, address, until));
    const given = Buffer.from(signature);

    return until > now() && expected.length === given.length && timingSafeEqual(expected, given);
  };

  const rewritten = (channelId: string, playlist: string, base: string): string =>
    playlist
      .split(/\r?\n/u)
      .map((line) => {
        const trimmed = line.trim();

        if (trimmed === '') {
          return line;
        }

        if (trimmed.startsWith('#')) {
          return line.replace(
            URI_ATTRIBUTE,
            (_, uri: string) => `URI="${linkFor(channelId, new URL(uri, base).toString())}"`,
          );
        }

        return linkFor(channelId, new URL(trimmed, base).toString());
      })
      .join('\n');

  const answer = async (
    channelId: string,
    query: { u: string | undefined; e: string | undefined; s: string | undefined },
    asking: { userAgent: string | null; referrer: string | null },
    fetcher: typeof fetch = fetch,
  ): Promise<Response | null> => {
    const address = query.u === undefined ? '' : Buffer.from(query.u, 'base64url').toString();
    const until = Number(query.e ?? 0);

    if (
      !/^https?:\/\//iu.test(address) ||
      !isSigned({ channelId, address, until, signature: query.s ?? '' })
    ) {
      return null;
    }

    const response = await fetcher(address, {
      headers: headersFor(asking),
      signal: AbortSignal.timeout(WAITS_MS),
    }).catch(() => null);

    if (response === null) {
      return new Response(null, { status: 504 });
    }

    if (!response.ok || response.body === null) {
      void response.body?.cancel();

      return new Response(null, { status: response.status >= 400 ? response.status : 502 });
    }

    const type = response.headers.get('content-type') ?? '';
    const base = response.headers.get(FINAL_ADDRESS) ?? (response.url || address);

    if (/dash\+xml/iu.test(type) || /\.mpd(\?|$)/iu.test(new URL(address).pathname)) {
      return new Response(dashRewritten(channelId, await response.text(), base), {
        status: 200,
        headers: { 'content-type': 'application/dash+xml', 'cache-control': 'no-store' },
      });
    }

    const isPlaylist = /mpegurl/iu.test(type) || /\.m3u8?(\?|$)/iu.test(new URL(address).pathname);

    if (isPlaylist) {
      const text = await response.text();

      return new Response(rewritten(channelId, text, base), {
        status: 200,
        headers: {
          'content-type': 'application/vnd.apple.mpegurl',
          'cache-control': 'no-store',
        },
      });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        'content-type': type === '' ? 'video/mp2t' : type,
        'cache-control': 'private, max-age=60',
      },
    });
  };

  const answerInDirectory = async (
    channelId: string,
    token: string,
    path: string,
    asking: { userAgent: string | null; referrer: string | null },
    fetcher: typeof fetch = fetch,
  ): Promise<Response | null> => {
    const [encoded = '', until = '0', signature = ''] = token.split('.');
    const directory = Buffer.from(encoded, 'base64url').toString();
    const address = /^https?:\/\//iu.test(directory) ? new URL(path, directory).toString() : '';

    if (
      address === '' ||
      !address.startsWith(directory) ||
      !isSigned({ channelId, address: `directory:${directory}`, until: Number(until), signature })
    ) {
      return null;
    }

    const response = await fetcher(address, {
      headers: headersFor(asking),
      signal: AbortSignal.timeout(WAITS_MS),
    }).catch(() => null);

    if (response === null) {
      return new Response(null, { status: 504 });
    }

    if (!response.ok || response.body === null) {
      void response.body?.cancel();

      return new Response(null, { status: response.status >= 400 ? response.status : 502 });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'video/mp4',
        'cache-control': 'private, max-age=60',
      },
    });
  };

  return { linkFor, answer, answerInDirectory };
};

type LiveRelay = ReturnType<typeof createLiveRelay>;

export type { LiveRelay };

export { createLiveRelay };
