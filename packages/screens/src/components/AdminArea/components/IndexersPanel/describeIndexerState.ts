import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';

type IndexerState = { label: string; tone: BadgeTone; detail: string | null };

/**
 * Says how an indexer is, as a badge and the line beneath it: turned off by Valence and why,
 * switched off by somebody, failing and why, working, or never tried.
 *
 * @param indexer - The indexer.
 * @returns The badge's words and tone, and the reason where there is one.
 */
const describeIndexerState = (indexer: Indexer): IndexerState => {
  if (indexer.turnedOffBecause !== null) {
    return { label: 'Turned off', tone: 'danger', detail: indexer.turnedOffBecause };
  }

  if (!indexer.isEnabled) {
    return { label: 'Off', tone: 'quiet', detail: null };
  }

  if (indexer.failures > 0) {
    return {
      label: indexer.failures === 1 ? 'Failed once' : `Failed ${indexer.failures.toString()} times`,
      tone: 'warning',
      detail: indexer.lastProblem,
    };
  }

  return indexer.capabilities === null
    ? { label: 'Not tried', tone: 'quiet', detail: null }
    : { label: 'Working', tone: 'success', detail: null };
};

export type { IndexerState };

export { describeIndexerState };
