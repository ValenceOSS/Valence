import type { RequestLogEntry } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestStage } from '@ValenceClient/requests/RequestStage';

const REQUESTS = 'requests.mediaRequests';

const WORKER = `${REQUESTS}.requestWorker`;

const HAND_OFF = 'requests.arrApps.handOff';

const STAGES: Readonly<Record<string, RequestStage>> = {
  [`${WORKER}.itIsOutAndWanted`]: 'release',
  [`${REQUESTS}.episodesOut`]: 'release',
  [`${REQUESTS}.searched`]: 'search',
  [`${REQUESTS}.searchedAs`]: 'search',
  [`${REQUESTS}.indexerCouldNotAnswer`]: 'search',
  [`${REQUESTS}.noneFoundForIt`]: 'search',
  [`${REQUESTS}.noIndexerOn`]: 'search',
  [`${REQUESTS}.choseButCouldNotSend`]: 'search',
  [`${WORKER}.nothingAcceptableHasBeenFoundYet`]: 'search',
  [`${WORKER}.forItOfThemForItAnd`]: 'search',
  [`${WORKER}.titleWasPickedByHand`]: 'search',
  [`${WORKER}.notTakenByProfile`]: 'search',
  [`${WORKER}.noOtherProfileTakesIt`]: 'search',
  [`${HAND_OFF}.askedNameToSearchAgain`]: 'search',
  [`${WORKER}.amongTheNewestReleasesSaid`]: 'search',
  [`${HAND_OFF}.nameIsDownloadingTitle`]: 'download',
  [`${WORKER}.theFilmIsOnItsWay`]: 'download',
  [`${HAND_OFF}.handedToName`]: 'download',
  [`${HAND_OFF}.askedNameToFetchTitle`]: 'download',
  [`${HAND_OFF}.askedNameToTryTitleAgain`]: 'download',
  [`${HAND_OFF}.askedNameToMonitorIt`]: 'download',
  [`${HAND_OFF}.blockedInName`]: 'download',
  [`${HAND_OFF}.nameSaidProblem`]: 'download',
  [`${WORKER}.titleFailedReasonItIsBlocklisted`]: 'download',
  [`${WORKER}.reasonTryingTheNextBestRelease`]: 'download',
  [`${WORKER}.stoppedTitleAndLookingForAnother`]: 'download',
  [`${WORKER}.stoppedTitleForAPickByHand`]: 'download',
  [`${WORKER}.stoppedTitleForAReleasePicked`]: 'download',
  [`${WORKER}.replacedByTitlePickedByHand`]: 'download',
  [`${WORKER}.itIsHandedToAConnectedApp`]: 'download',
  [`${WORKER}.removedFromTheDownloads`]: 'download',
  [`${WORKER}.theDownloadWasTakenOutBefore`]: 'download',
  [`${WORKER}.itsDownloadWasTakenOutBefore`]: 'download',
  [`${WORKER}.partOfNameWasNeverWritten`]: 'download',
  [`${WORKER}.nameHasNotSaidWhereIt`]: 'download',
  [`${REQUESTS}.itsClientHasNotSaidWhere`]: 'download',
  [`${WORKER}.filedSizeFromTitleIntoFolder`]: 'import',
  [`${WORKER}.filedOfTotalTracks`]: 'import',
  [`${WORKER}.filedFromThePack`]: 'import',
  [`${WORKER}.titleWasNotFiledFirstRefusalIt`]: 'import',
  [`${WORKER}.titleIsCheckedAgainBeforeFiling`]: 'import',
  [`${WORKER}.itIsAbridgedHaveAgainstWant`]: 'import',
  [`${WORKER}.theRequestsServiceMayNotWrite`]: 'import',
  [`${HAND_OFF}.nameImportedItIntoFolder`]: 'import',
  [`${REQUESTS}.notFiled`]: 'import',
  [`${REQUESTS}.couldNotBeFiled`]: 'import',
};

/**
 * Which stage of fetching a request one line of its activity belongs to: its coming out, finding a
 * release, downloading it, or importing it into the library.
 *
 * @param line - The line.
 * @returns The stage, or null for a line that could come at any stage.
 */
const stageOfRequestLog = (line: RequestLogEntry): RequestStage | null =>
  line.message.code === null ? null : (STAGES[line.message.code] ?? null);

export { stageOfRequestLog };
