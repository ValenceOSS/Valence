import type { KeptListeningStanding } from '@ValenceClient/downloads/standingOfKeptListening';
import { say } from '@ValenceI18n/say';

type KeptListeningDescription = {
  says: string;
  next: 'pause' | 'carryOn' | 'remove';
};

/**
 * What a download button says about music or an audiobook being kept, and what pressing it does.
 *
 * @param standing - How far it has got.
 * @returns The words, and what pressing does.
 */
const describeKeptListening = (standing: KeptListeningStanding): KeptListeningDescription => {
  const counted = { done: standing.filesHere, total: standing.filesInAll };

  if (standing.state === 'here') {
    return { says: say('common.downloaded'), next: 'remove' };
  }

  if (standing.state === 'fetching') {
    return {
      says: say('client.downloads.describeKeptListening.downloadingDoneOfTotal', counted),
      next: 'pause',
    };
  }

  if (standing.state === 'failed') {
    return {
      says: say('client.downloads.describeKeptListening.couldNotDownloadDoneOfTotal', counted),
      next: 'carryOn',
    };
  }

  return {
    says: say('client.downloads.describeKeptListening.pausedAtDoneOfTotal', counted),
    next: 'carryOn',
  };
};

export type { KeptListeningDescription };

export { describeKeptListening };
