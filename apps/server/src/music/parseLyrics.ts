import type { LyricLine, Lyrics } from '@ValenceContracts/schemas/Music';

const STAMP = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

const HEADER = /^\[(ar|ti|al|au|by|length|offset|re|ve|#):/i;

const OFFSET = /^\[offset:\s*([+-]?\d+)\s*\]/im;

/**
 * Reads the time a line of synced lyrics is sung at out of its stamp.
 *
 * @param minutes - The minutes.
 * @param seconds - The seconds.
 * @param fraction - Hundredths, or thousandths where three digits were written.
 * @returns The time in milliseconds.
 */
const stampToMs = (minutes: string, seconds: string, fraction: string | undefined): number => {
  const part = fraction === undefined ? 0 : Number(fraction.padEnd(3, '0').slice(0, 3));

  return Number(minutes) * 60_000 + Number(seconds) * 1000 + part;
};

/**
 * Reads lyrics as they are kept beside a track or inside it, into lines to show.
 *
 * LRC is read where it is there: every stamp on a line is a time that line is sung, so a chorus
 * written once with four stamps comes out as four lines in their places, and an `[offset:]` header
 * moves the whole song the way it says. Anything without a single stamp is plain lyrics, kept as
 * lines with no time, which a screen shows without following along.
 *
 * @param text - The lyrics as written.
 * @returns The lines, and whether they follow the song.
 */
const parseLyrics = (text: string): Lyrics => {
  const offset = Number(OFFSET.exec(text)?.[1] ?? 0);
  const timed: LyricLine[] = [];
  const plain: LyricLine[] = [];

  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (HEADER.test(raw.trim())) {
      continue;
    }

    const stamps = [...raw.matchAll(STAMP)];
    const words = raw.replace(STAMP, '').trim();

    if (stamps.length === 0) {
      plain.push({ atMs: null, text: raw.trim() });

      continue;
    }

    for (const stamp of stamps) {
      const at = stampToMs(stamp[1] ?? '0', stamp[2] ?? '0', stamp[3]);

      timed.push({ atMs: Math.max(0, at - offset), text: words });
    }
  }

  if (timed.length > 0) {
    return {
      isSynced: true,
      lines: timed.sort((left, right) => (left.atMs ?? 0) - (right.atMs ?? 0)),
    };
  }

  const kept = plain.filter(
    (line, at) => line.text !== '' || (at > 0 && plain[at - 1]?.text !== ''),
  );
  const from = kept.findIndex((line) => line.text !== '');

  return {
    isSynced: false,
    lines: (from === -1 ? [] : kept.slice(from)).filter(
      (line, at, all) => line.text !== '' || at < all.length - 1,
    ),
  };
};

export { parseLyrics };
