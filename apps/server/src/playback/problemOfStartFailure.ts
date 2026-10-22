import type { PlaybackProblem } from '@ValenceContracts/schemas/PlaybackProblem';
import { TranscoderError } from '@ValenceServer/transcoder/TranscoderClient';

const DEPTH = 4;

const UNREACHABLE_CODES: readonly string[] = [
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOENT',
  'EPIPE',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
];

const NOT_FOUND = 404;

const FORBIDDEN = 403;

/**
 * The error a failure was caused by, where it says.
 *
 * @param error - The failure.
 * @returns What lies beneath it, or nothing.
 */
const beneath = (error: Error): Error | null => {
  if (error.cause instanceof Error) {
    return error.cause;
  }

  if (error instanceof AggregateError) {
    return error.errors.find((gathered) => gathered instanceof Error) ?? null;
  }

  return null;
};

/**
 * Which playback problem a session that would not start was, read from what failed: the media
 * service refusing the file as one it cannot find or may not read, the media service not answering
 * at all, or anything else. A player says each differently, and the admin fixes each differently.
 *
 * @param error - What failed.
 * @returns The problem.
 */
const problemOfStartFailure = (error: Error): PlaybackProblem => {
  let held: Error | null = error;

  for (let depth = 0; depth < DEPTH && held !== null; depth += 1) {
    if (held instanceof TranscoderError) {
      return held.status === NOT_FOUND
        ? 'missing'
        : held.status === FORBIDDEN
          ? 'unreadable'
          : 'unknown';
    }

    const code = 'code' in held && typeof held.code === 'string' ? held.code : null;

    if (code !== null && UNREACHABLE_CODES.includes(code)) {
      return 'converterDown';
    }

    held = beneath(held);
  }

  return 'unknown';
};

export { problemOfStartFailure };
