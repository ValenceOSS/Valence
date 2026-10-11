import { headersFor } from './headersFor';
import type { LiveHealth } from '@ValenceContracts/schemas/LiveTv';

const WAITS_MS = 12_000;

const MOST_BYTES = 2 * 1024 * 1024;

type Asking = { userAgent: string | null; referrer: string | null };

/**
 * What a segment's answer says of the channel: that pictures are flowing, that the channel is there
 * but not sending, that it is refused, or that nothing answered well.
 *
 * @param status - The HTTP status, or nothing where nothing answered.
 * @returns The channel's health.
 */
const healthOfStatus = (status: number | null): LiveHealth => {
  if (status === null) {
    return 'unreachable';
  }

  if (status === 200 || status === 206) {
    return 'onAir';
  }

  if (status === 404 || status === 410) {
    return 'offAir';
  }

  return status === 401 || status === 403 || status === 451 ? 'refused' : 'unreachable';
};

/**
 * Reads the start of an answer as text, stopping at a size no playlist or manifest reaches, since
 * a stream sent as it is never ends.
 *
 * @param response - The answer.
 * @param mostBytes - The most to read.
 * @returns The text read.
 */
const readUpTo = async (response: Response, mostBytes: number): Promise<string> => {
  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let read = 0;

  while (reader !== undefined && read < mostBytes) {
    const next = await reader.read().catch(() => null);
    const value: Uint8Array | null = next?.value instanceof Uint8Array ? next.value : null;

    if (next === null || next.done || value === null) {
      break;
    }

    chunks.push(value);
    read += value.length;
  }

  await reader?.cancel().catch(() => undefined);

  return new TextDecoder().decode(Buffer.concat(chunks));
};

/**
 * The answer for one address, its text where it answered well, and where it ended up.
 *
 * @param address - The address.
 * @param asking - The user agent and referrer to ask with.
 * @param fetcher - How to ask.
 * @param isWhole - Whether the whole of it is wanted, rather than its first kilobyte.
 * @returns The status and text, or nothing where nothing answered.
 */
const ask = async (
  address: string,
  asking: Asking,
  fetcher: typeof fetch,
  isWhole: boolean,
): Promise<{ status: number; text: string; at: string } | null> => {
  const response = await fetcher(address, {
    headers: { ...headersFor(asking), ...(isWhole ? {} : { range: 'bytes=0-1023' }) },
    signal: AbortSignal.timeout(WAITS_MS),
  }).catch(() => null);

  if (response === null) {
    return null;
  }

  const text = isWhole && response.ok ? await readUpTo(response, MOST_BYTES) : '';

  void response.body?.cancel().catch(() => undefined);

  return {
    status: response.status,
    text,
    at: response.headers.get('x-valence-final-address') ?? (response.url || address),
  };
};

/**
 * The address of the newest segment an HLS media playlist lists.
 *
 * @param playlist - The playlist.
 * @param base - Where it was read from.
 * @returns The address, or nothing where it lists none.
 */
const newestSegmentOf = (playlist: string, base: string): string | null => {
  const listed = playlist
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
  const newest = listed.at(-1);

  return newest === undefined ? null : new URL(newest, base).toString();
};

/**
 * The address of the segment a numbered DASH manifest is up to now, worked out from when it began
 * and how long its segments are, a few back from the newest so it is sure to have been written.
 *
 * @param manifest - The manifest.
 * @param base - Where it was read from.
 * @param now - The time now, in milliseconds.
 * @returns The address, or nothing where the manifest is not numbered that way.
 */
const currentDashSegmentOf = (manifest: string, base: string, now: number): string | null => {
  const begun = /availabilityStartTime="([^"]+)"/u.exec(manifest)?.[1];
  const template = /<SegmentTemplate\b([^>]*)>/u.exec(manifest)?.[1] ?? '';
  const media = /\bmedia="([^"]*\$Number\$[^"]*)"/u.exec(template)?.[1];
  const duration = Number(/\bduration="(\d+)"/u.exec(template)?.[1] ?? 0);
  const timescale = Number(/\btimescale="(\d+)"/u.exec(template)?.[1] ?? 1);
  const first = Number(/\bstartNumber="(\d+)"/u.exec(template)?.[1] ?? 1);

  if (begun === undefined || media === undefined || duration === 0) {
    return null;
  }

  const seconds = (now - Date.parse(begun)) / 1000;
  const number = first + Math.max(Math.floor(seconds / (duration / timescale)) - 3, 0);

  return new URL(
    media.replace(/\$RepresentationID\$/gu, '').replace(/\$Number(%0\d+d)?\$/gu, number.toString()),
    base,
  ).toString();
};

/**
 * Whether a channel is on air now, asked of the stream itself: its playlist or manifest, and then
 * one real segment of pictures from where it is up to — since a stream whose playlist answers but
 * whose pictures are missing is a channel that is not broadcasting, as an event channel between
 * events is.
 *
 * @param streamUrl - Where the channel streams from.
 * @param asking - The user agent and referrer it insists on.
 * @param fetcher - How to ask.
 * @param now - The time now, in milliseconds.
 * @returns How the channel is.
 */
const checkChannel = async (
  streamUrl: string,
  asking: Asking,
  fetcher: typeof fetch,
  now: number = Date.now(),
): Promise<LiveHealth> => {
  if (!/^https?:\/\//iu.test(streamUrl)) {
    return 'unsure';
  }

  const top = await ask(streamUrl, asking, fetcher, true);

  if (top === null || top.status < 200 || top.status >= 300) {
    return healthOfStatus(top?.status ?? null);
  }

  if (top.text.trimStart().startsWith('#EXTM3U')) {
    const variant = /#EXT-X-STREAM-INF[^\n]*\n\s*([^#\s][^\n]*)/u.exec(top.text)?.[1]?.trim();
    const media =
      variant === undefined
        ? top
        : await ask(new URL(variant, top.at).toString(), asking, fetcher, true);

    if (media === null || media.status < 200 || media.status >= 300) {
      return healthOfStatus(media?.status ?? null);
    }

    const segment = newestSegmentOf(media.text, media.at);

    return segment === null
      ? 'offAir'
      : healthOfStatus((await ask(segment, asking, fetcher, false))?.status ?? null);
  }

  if (/<MPD\b/u.test(top.text)) {
    const segment = currentDashSegmentOf(top.text, top.at, now);

    return segment === null
      ? 'onAir'
      : healthOfStatus((await ask(segment, asking, fetcher, false))?.status ?? null);
  }

  return /^\s*</u.test(top.text) ? 'notAStream' : 'onAir';
};

export { checkChannel };
