import { REENCODE_MAX_BITRATE_KBPS } from '@ValenceContracts/schemas/Reencode';

type BitrateReading = { kind: 'none' } | { kind: 'kbps'; kbps: number } | { kind: 'invalid' };

/**
 * What was typed into a bitrate ceiling: nothing, a ceiling Valence will take, or neither.
 *
 * @param typed - The field's text.
 * @returns The reading.
 */
const readBitrate = (typed: string): BitrateReading => {
  const trimmed = typed.trim();

  if (trimmed === '') {
    return { kind: 'none' };
  }

  const kbps = Number(trimmed);

  return Number.isInteger(kbps) &&
    kbps >= REENCODE_MAX_BITRATE_KBPS.min &&
    kbps <= REENCODE_MAX_BITRATE_KBPS.max
    ? { kind: 'kbps', kbps }
    : { kind: 'invalid' };
};

export type { BitrateReading };

export { readBitrate };
