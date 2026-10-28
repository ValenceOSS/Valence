import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Spinner } from '@ValenceUI/Spinner';
import { StepTrail } from '@ValenceUI/StepTrail';
import type {
  StepTrailAside,
  StepTrailLine,
  StepTrailMarkKind,
  StepTrailStep,
} from '@ValenceUI/StepTrail.types';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { describeDownloadLine } from '@ValenceClient/requests/describeDownloadLine';
import { describeTimeTaken } from '@ValenceClient/requests/describeTimeTaken';
import { stepsOfRequestLog } from '@ValenceClient/requests/stepsOfRequestLog';
import { toneOfRequestLog } from '@ValenceClient/requests/toneOfRequestLog';
import type { RequestStage } from '@ValenceClient/requests/RequestStage';
import type { RequestStep, RequestStepOutcome } from '@ValenceClient/requests/RequestStep';
import type { RequestNow } from '@ValenceContracts/schemas/RequestNow';
import { useTakingTurns } from '@ValenceScreens/requests/useTakingTurns';
import type { RequestHistoryTabProps } from './RequestHistoryTab.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const WHEN = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const TURN_MS = 1400;

const MARKS: Readonly<Record<RequestStepOutcome, StepTrailMarkKind>> = {
  done: 'done',
  failed: 'failed',
  current: 'current',
  stuck: 'current',
  later: 'waiting',
  asks: 'locked',
  refused: 'failed',
};

/**
 * What a step of fetching a request is called.
 *
 * @param stage - The stage it is.
 * @returns Its name.
 */
const nameOf = (stage: RequestStage): string => {
  switch (stage) {
    case 'approval':
      return say('screens.requestDetailDialog.requestHistoryTab.approveTheRequest');
    case 'release':
      return say('common.released');
    case 'search':
      return say('screens.requestDetailDialog.requestHistoryTab.findARelease');
    case 'download':
      return say('common.downloadIt');
    case 'import':
      return say('screens.requestDetailDialog.requestHistoryTab.importIt');
  }
};

/**
 * The word for a step that is under way, saying what it is doing.
 *
 * @param stage - The stage it is.
 * @returns The word.
 */
const doingOf = (stage: RequestStage): string => {
  switch (stage) {
    case 'approval':
      return say('client.requests.nameTheStanding.waitingForApproval');
    case 'release':
      return say('common.waiting');
    case 'search':
      return say('common.searching');
    case 'download':
      return say('common.downloading');
    case 'import':
      return say('common.filing');
  }
};

/**
 * What a step under way is called while something is happening in it: the indexer a search is
 * waiting on, taking turns between them where it waits on several, how far a download has come, and
 * what is being imported.
 *
 * @param now - What the request is doing right now.
 * @param turn - Whose turn it is among the indexers still being searched.
 * @returns The name, or nothing where nothing live is known.
 */
const liveNameOf = (now: RequestNow, turn: number): string | null => {
  if (now === null) {
    return null;
  }

  switch (now.stage) {
    case 'search': {
      const asking = now.indexers.filter((indexer) => indexer.state === 'asking');
      const shown = asking[turn % Math.max(asking.length, 1)];

      return shown === undefined
        ? say('screens.requestDetailDialog.requestHistoryTab.choosingARelease')
        : say('screens.requestDetailDialog.requestHistoryTab.searchingName', { name: shown.name });
    }
    case 'download':
      return say('screens.requestDetailDialog.requestHistoryTab.downloadingPercent', {
        percent: Math.floor(now.progress * 100).toString(),
      });
    case 'import':
      return say('common.filing');
  }
};

/**
 * The few words at the end of a step under way while something is happening in it: how many
 * indexers have answered, or how much of a download has come and how fast.
 *
 * @param now - What the request is doing right now.
 * @returns The words, or nothing to fall back on the plain word for the step.
 */
const liveAsideOf = (now: RequestNow): string | null => {
  if (now?.stage === 'search') {
    return say('screens.requestDetailDialog.requestHistoryTab.answeredOfTotal', {
      answered: now.indexers.filter((indexer) => indexer.state !== 'asking').length.toString(),
      total: now.indexers.length.toString(),
    });
  }

  return now?.stage === 'download' ? describeDownloadLine(now) : null;
};

/**
 * The lines a step under way shows of what is happening in it now, after the lines it has written:
 * one for each indexer a search is asking, settling to what it found or that it did not answer, a
 * bar for a download, and the release being imported.
 *
 * @param now - What the request is doing right now.
 * @returns The lines.
 */
const liveLinesOf = (now: RequestNow): StepTrailLine[] => {
  if (now === null) {
    return [];
  }

  switch (now.stage) {
    case 'search':
      return now.indexers.map((indexer) => ({
        id: `now-${indexer.name}`,
        mark:
          indexer.state === 'asking' ? 'current' : indexer.state === 'failed' ? 'failed' : 'quiet',
        content:
          indexer.state === 'asking' ? (
            <span className="valence-shimmer-text">
              {say('screens.requestDetailDialog.requestHistoryTab.searchingName', {
                name: indexer.name,
              })}
            </span>
          ) : indexer.state === 'failed' ? (
            say('screens.requestDetailDialog.requestHistoryTab.nameDidNotAnswer', {
              name: indexer.name,
            })
          ) : (
            sayCount(
              'screens.requestDetailDialog.requestHistoryTab.nameFoundCount',
              indexer.found,
              {
                name: indexer.name,
              },
            )
          ),
      }));
    case 'download':
      return [
        {
          id: `now-${now.downloadId}`,
          mark: 'current',
          content: (
            <ProgressBar
              isThin
              label={say('screens.requestDetailDialog.requestHistoryTab.nameIsDownloading', {
                name: now.clientName,
              })}
              value={now.progress}
              max={1}
              className="mt-1.5 max-w-md"
            />
          ),
        },
      ];
    case 'import':
      return [
        {
          id: 'now-import',
          mark: 'current',
          content: (
            <span className="valence-shimmer-text">
              {say('screens.requestDetailDialog.requestHistoryTab.importingTitle', {
                title: now.title,
              })}
            </span>
          ),
        },
      ];
  }
};

/**
 * What sits at the end of a step's row: how long it took once it is done and the next began, what it
 * is doing while it is under way, and whether it failed, found nothing it would take, or waits on an
 * admin.
 *
 * @param step - The step.
 * @returns The aside, or nothing for a step still to come.
 */
const asideOf = (step: RequestStep): StepTrailAside | undefined => {
  switch (step.outcome) {
    case 'done':
      return step.stage === 'release' ||
        step.startedAt === null ||
        step.endedAt === null ||
        step.endedAt === step.lines.at(-1)?.at
        ? undefined
        : { kind: 'note', text: describeTimeTaken(step.startedAt, step.endedAt) };
    case 'current':
      return { kind: 'state', text: liveAsideOf(step.now) ?? doingOf(step.stage), tone: 'accent' };
    case 'stuck':
      return {
        kind: 'state',
        text: say('screens.requestDetailDialog.requestHistoryTab.nothingToTakeYet'),
        tone: 'warning',
      };
    case 'failed':
      return { kind: 'state', text: say('common.failed'), tone: 'danger' };
    case 'refused':
      return { kind: 'state', text: say('common.refused'), tone: 'danger' };
    case 'asks':
      return {
        kind: 'badge',
        text: say('screens.requestDetailDialog.requestHistoryTab.needsApproval'),
        tone: 'highlight',
      };
    case 'later':
      return undefined;
  }
};

/**
 * One step of fetching a request as a step of the trail, its lines each with when they were said and,
 * for a problem, how to fix it.
 *
 * @param step - The step.
 * @param place - Where it comes in the trail, which it is known by, so a step that becomes another
 *   as the request moves on changes in place.
 * @param isNewest - Whether it is the newest step anything has happened in.
 * @param turn - Whose turn it is among the indexers a search is still waiting on.
 * @returns The step of the trail.
 */
const trailStepOf = (
  step: RequestStep,
  place: number,
  isNewest: boolean,
  turn: number,
): StepTrailStep => {
  const isUnderWay = step.outcome === 'current' || step.outcome === 'stuck';
  const lines = step.lines.map((line, at): StepTrailLine => ({
    id: line.id.toString(),
    mark:
      toneOfRequestLog(line) === 'danger'
        ? 'failed'
        : isUnderWay && step.now === null && at === step.lines.length - 1
          ? 'current'
          : 'quiet',
    content: (
      <span className="flex items-baseline justify-between gap-4">
        <span className="flex min-w-0 flex-col items-start gap-0.5">
          <span className="break-words">{sayAgain(line.message)}</span>
          <HowToFix href={docsFor(line.problemCode)} />
        </span>
        <time dateTime={line.at} className="shrink-0 text-xs tabular-nums text-text-muted/70">
          {WHEN.format(new Date(line.at))}
        </time>
      </span>
    ),
  }));

  return {
    id: place.toString(),
    label: liveNameOf(step.now, turn) ?? nameOf(step.stage),
    mark: MARKS[step.outcome],
    aside: asideOf(step),
    lines: [...lines, ...liveLinesOf(step.now)],
    isOpenAtFirst: isNewest && step.outcome !== 'done',
  };
};

/**
 * What a request has done, as the steps of fetching it: its coming out, finding a release,
 * downloading it and importing it, with a step for an admin's approval where it waits on
 * one. Each finished step says how long it took and opens to show what happened in it, the step
 * under way shows its lines as they arrive, and the steps still to come wait below. What it is doing
 * right now is read every second or so: the step under way is named for it, such as the indexer a
 * search is waiting on or how far a download has come, with a line for each indexer or a bar for the
 * download beneath it.
 *
 * @param request - The request.
 */
const RequestHistoryTab = ({ request }: RequestHistoryTabProps) => {
  const said = useQuery(requestsQueries.mediaRequestLog(request.id));
  const now = useQuery(requestsQueries.mediaRequestNow(request.id, true)).data ?? null;
  const turn = useTakingTurns(
    now?.stage === 'search'
      ? now.indexers.filter((indexer) => indexer.state === 'asking').length
      : 0,
    TURN_MS,
  );

  if (said.isError) {
    return (
      <CouldNotRead
        said={say('common.whatItHasDoneCouldNotBeRead')}
        isTryingAgain={said.isFetching}
        onTryAgain={() => {
          void said.refetch();
        }}
      />
    );
  }

  if (said.data === undefined) {
    return (
      <Spinner
        isCentered
        label={say('screens.requestDetailDialog.requestHistoryTab.readingWhatItHasDone')}
        size="sm"
      />
    );
  }

  const steps = stepsOfRequestLog(request, said.data, now);
  const newest = steps.findLastIndex((step) => step.lines.length > 0 || step.now !== null);

  return (
    <StepTrail
      label={say('common.history')}
      steps={steps.map((step, at) => trailStepOf(step, at, at === newest, turn))}
    />
  );
};

RequestHistoryTab.displayName = 'RequestHistoryTab';

export { RequestHistoryTab };
