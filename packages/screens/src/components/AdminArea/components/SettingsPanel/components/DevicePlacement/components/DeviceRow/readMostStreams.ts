import { MOST_STREAMS_PER_DEVICE } from '@ValenceContracts/schemas/DevicePlacement';

/**
 * Reads what was typed for the most streams one device may take.
 *
 * @param typed - What is in the field.
 * @returns The number, null where the field was left empty to mean as many as it can, or
 *   undefined where what was typed is not a number of streams.
 */
const readMostStreams = (typed: string): number | null | undefined => {
  const trimmed = typed.trim();

  if (trimmed === '') {
    return null;
  }

  const read = Number(trimmed);

  return Number.isInteger(read) && read >= 1 && read <= MOST_STREAMS_PER_DEVICE ? read : undefined;
};

export { readMostStreams };
