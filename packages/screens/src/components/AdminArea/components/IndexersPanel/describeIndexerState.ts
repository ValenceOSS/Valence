import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';
import type { StateBadge } from '@ValenceClient/status/StateBadge';
import { say } from '@ValenceI18n/say';

/**
 * Says how an indexer is, as a badge and the line beneath it: resting after failing too often, and
 * why, switched off by somebody, failing and why, online, or never tried.
 *
 * @param indexer - The indexer.
 * @returns The badge's words and tone, and the reason where there is one.
 */
const describeIndexerState = (indexer: Indexer): StateBadge => {
  if (indexer.turnedOffBecause !== null) {
    return {
      label: say('screens.indexersPanel.describeIndexerState.resting'),
      tone: 'danger',
      detail: sayAgain(indexer.turnedOffBecause),
      help: docsFor(indexer.lastProblemCode),
    };
  }

  if (!indexer.isEnabled) {
    return { label: say('common.off'), tone: 'quiet', detail: null };
  }

  if (indexer.failures > 0) {
    return {
      label:
        indexer.failures === 1
          ? say('screens.indexersPanel.describeIndexerState.failedOnce')
          : say('screens.indexersPanel.describeIndexerState.failedFailuresTimes', {
              failures: indexer.failures.toString(),
            }),
      tone: 'warning',
      detail: indexer.lastProblem === null ? null : sayAgain(indexer.lastProblem),
      help: docsFor(indexer.lastProblemCode),
    };
  }

  return indexer.capabilities === null
    ? {
        label: say('screens.indexersPanel.describeIndexerState.notTried'),
        tone: 'quiet',
        detail: null,
      }
    : { label: say('common.online'), tone: 'success', detail: null };
};

export { describeIndexerState };
