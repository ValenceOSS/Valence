import { randomBytes } from 'node:crypto';
import type { TrailerParts } from './TrailerParts';

const KEPT_FOR = 6 * 60 * 60 * 1000;

const A_PART = /^(\d+)(?:\.m3u8)?$/u;

type Opened = { urls: string[]; numbered: Map<string, number>; until: number };

/**
 * The addresses a trailer's playlists and pieces are served from by this server in place of
 * YouTube's, which only answer the server they were given to.
 *
 * Each trailer played is given a token too long to guess, and each of YouTube's addresses in its
 * playlists a number under that token, so an address on this server only ever stands for one
 * YouTube gave the server for that trailer: nothing anybody writes into one can send the server
 * anywhere else. A token is let go after a few hours, as YouTube's addresses are.
 *
 * @param now - The clock, for tests.
 * @returns The parts.
 */
const createTrailerParts = (now: () => number = Date.now): TrailerParts => {
  const opened = new Map<string, Opened>();

  return {
    open: () => {
      for (const [token, held] of opened) {
        if (held.until <= now()) {
          opened.delete(token);
        }
      }

      const token = randomBytes(18).toString('base64url');

      opened.set(token, { urls: [], numbered: new Map(), until: now() + KEPT_FOR });

      return token;
    },
    addressOf: (token, url, isPlaylist) => {
      const held = opened.get(token);
      const number = held?.numbered.get(url) ?? held?.urls.push(url);

      if (held !== undefined && number !== undefined) {
        held.numbered.set(url, number);
      }

      return `/api/requests/trailers/${token}/${String(number ?? 0)}${isPlaylist ? '.m3u8' : ''}`;
    },
    urlOf: (token, part) => {
      const held = opened.get(token);
      const number = Number(A_PART.exec(part)?.[1]);

      return held === undefined || held.until <= now() ? null : (held.urls[number - 1] ?? null);
    },
  };
};

export { createTrailerParts };
