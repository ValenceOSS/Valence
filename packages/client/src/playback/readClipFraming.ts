import type { ClipFraming } from './ClipFraming';

const FRAMING_HEADER = 'x-valence-picture-framing';

/**
 * Asks whether a clip is ready, as the server answers for a title's preview, and how its picture
 * sits in its frame where the server has measured it: how wide and tall the measured picture is,
 * and the black bars at its top, right, bottom and left, so whatever plays it can zoom past them.
 *
 * @param url - Where the clip is.
 * @returns Whether it is ready, still being made or not coming, and its framing where known.
 */
const readClipFraming = async (
  url: string,
): Promise<{ state: 'ready' | 'pending' | 'absent'; framing: ClipFraming | null }> => {
  const response = await fetch(url, { headers: { Range: 'bytes=0-0' } }).catch(() => null);

  if (response === null || (!response.ok && response.status !== 202)) {
    return { state: 'absent', framing: null };
  }

  if (response.status === 202) {
    return { state: 'pending', framing: null };
  }

  const [wide, high, top, right, bottom, left] = (response.headers.get(FRAMING_HEADER) ?? '')
    .split(',')
    .map(Number);

  return {
    state: 'ready',
    framing:
      wide === undefined ||
      high === undefined ||
      top === undefined ||
      right === undefined ||
      bottom === undefined ||
      left === undefined ||
      [wide, high, top, right, bottom, left].some((part) => !Number.isFinite(part)) ||
      wide <= 0 ||
      high <= 0
        ? null
        : { wide, high, top, right, bottom, left },
  };
};

export { readClipFraming };
