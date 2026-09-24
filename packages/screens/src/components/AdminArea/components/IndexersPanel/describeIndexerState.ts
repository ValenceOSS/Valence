import { docsFor } from '@ValenceCore/functions/docsFor';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';
import type { StateBadge } from '@ValenceClient/status/StateBadge';

/**
 * Says how an indexer is, as a badge and the line beneath it: turned off by Valence and why,
 * switched off by somebody, failing and why, working, or never tried.
 *
 * @param indexer - The indexer.
 * @returns The badge's words and tone, and the reason where there is one.
 */
const describeIndexerState = (indexer: Indexer): StateBadge => {
  if (indexer.turnedOffBecause !== null) {
    return {
      label: 'Turned off',
      tone: 'danger',
      detail: indexer.turnedOffBecause,
      help: docsFor(indexer.lastProblemCode),
    };
  }

  if (!indexer.isEnabled) {
    return { label: 'Off', tone: 'quiet', detail: null };
  }

  if (indexer.failures > 0) {
    return {
      label: indexer.failures === 1 ? 'Failed once' : `Failed ${indexer.failures.toString()} times`,
      tone: 'warning',
      detail: indexer.lastProblem,
      help: docsFor(indexer.lastProblemCode),
    };
  }

  return indexer.capabilities === null
    ? { label: 'Not tried', tone: 'quiet', detail: null }
    : { label: 'Working', tone: 'success', detail: null };
};

export { describeIndexerState };
