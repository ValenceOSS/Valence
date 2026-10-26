import { refuse } from '@ValenceI18n/refuse';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { SourceTrouble, TroubleReason } from './SourceTrouble';

const SAID: Readonly<Record<TroubleReason, StringKey>> = {
  rateLimited: 'error.sources.sourceIsLimitingHowOften',
  keyMissing: 'error.sources.thereIsNoKeyForSource',
  keyRefused: 'error.sources.sourceDidNotAcceptTheKey',
  refused: 'error.sources.sourceRefusedTheRequest',
  faulty: 'error.sources.sourceIsHavingProblems',
  unreachable: 'error.sources.couldNotReachSource',
};

/**
 * Says why a site could not be asked, for a search that found nothing because of it rather than
 * because there was nothing to find.
 *
 * @param trouble - What went wrong, and with which site.
 * @returns The refusal to answer with.
 */
const refuseForTrouble = (trouble: SourceTrouble) =>
  refuse(SAID[trouble.reason], { source: trouble.source });

export { refuseForTrouble };
