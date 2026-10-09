import type { Said } from '@ValenceI18n/SaidSchema';
import type { RequestLogEntry } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestLogTone } from '@ValenceClient/requests/RequestLogTone';

const WORKER = 'requests.mediaRequests.requestWorker';

const HAND_OFF = 'requests.arrApps.handOff';

const TONES: Readonly<Record<string, RequestLogTone>> = {
  [`${WORKER}.filedSizeFromTitleIntoFolder`]: 'success',
  [`${HAND_OFF}.nameImportedItIntoFolder`]: 'success',
  [`${WORKER}.titleWasPickedByHand`]: 'busy',
  [`${WORKER}.replacedByTitlePickedByHand`]: 'busy',
  [`${WORKER}.stoppedTitleForAReleasePicked`]: 'busy',
  [`${HAND_OFF}.nameIsDownloadingTitle`]: 'busy',
  [`${HAND_OFF}.handedToName`]: 'busy',
  [`${HAND_OFF}.askedNameToFetchTitle`]: 'busy',
  'requests.mediaRequests.searched': 'accent',
  'requests.mediaRequests.searchedAs': 'accent',
  [`${WORKER}.amongTheNewestReleasesSaid`]: 'accent',
  [`${WORKER}.itIsOutAndWanted`]: 'accent',
  [`${WORKER}.itsDownloadWasTakenOutBefore`]: 'accent',
  [`${HAND_OFF}.askedNameToSearchAgain`]: 'accent',
  [`${HAND_OFF}.askedNameToMonitorIt`]: 'accent',
  [`${HAND_OFF}.askedNameToTryTitleAgain`]: 'accent',
  [`${WORKER}.titleFailedReasonItIsBlocklisted`]: 'danger',
  [`${WORKER}.titleWasNotFiledFirstRefusalIt`]: 'danger',
  [`${WORKER}.itIsAbridgedHaveAgainstWant`]: 'danger',
  [`${WORKER}.filedOfTotalTracks`]: 'danger',
  [`${WORKER}.stoppedTitleAndLookingForAnother`]: 'danger',
  [`${WORKER}.stoppedTitleForAPickByHand`]: 'danger',
  [`${WORKER}.reasonTryingTheNextBestRelease`]: 'danger',
  'requests.mediaRequests.notFiled': 'danger',
  'requests.mediaRequests.couldNotBeFiled': 'danger',
  'requests.mediaRequests.indexerCouldNotAnswer': 'danger',
  [`${HAND_OFF}.nameSaidProblem`]: 'danger',
  [`${HAND_OFF}.blockedInName`]: 'danger',
};

const CHOSE = `${WORKER}.choseTitleTheBestOfForIt`;

const NONE_WOULD_DO = [
  `${WORKER}.forItOfThemForItAnd`,
  `${WORKER}.nothingAcceptableHasBeenFoundYet`,
];

/**
 * Every message code in a said line, its own and those of every part said within it.
 *
 * @param said - The line.
 * @returns The codes, outermost first.
 */
const codesIn = (said: Said): string[] => [
  ...(said.code === null ? [] : [said.code]),
  ...Object.values(said.values).flatMap((value) =>
    typeof value === 'object' ? codesIn(value) : [],
  ),
];

/**
 * The colour of the dot beside a line of a request's activity: green for something imported, orange
 * for something fetching, blue for a search or a wait, yellow for a search that found nothing it
 * would take, red for a failure, and grey for the rest. A search that chose a release reads as
 * fetching, since that is what it set going.
 *
 * @param line - The line of the request's activity.
 * @returns Its tone.
 */
const toneOfRequestLog = (line: RequestLogEntry): RequestLogTone => {
  if (line.problemCode !== null) {
    return 'danger';
  }

  const codes = codesIn(line.message);
  const tone = TONES[codes[0] ?? ''] ?? 'quiet';

  if (tone !== 'accent') {
    return tone;
  }

  if (codes.includes(CHOSE)) {
    return 'busy';
  }

  return codes.some((code) => NONE_WOULD_DO.includes(code)) ? 'highlight' : tone;
};

export { toneOfRequestLog };
