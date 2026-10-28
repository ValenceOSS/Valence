import type { MediaRequest, RequestLogEntry } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestNow } from '@ValenceContracts/schemas/RequestNow';
import type { RequestStage } from '@ValenceClient/requests/RequestStage';
import type { RequestStep, RequestStepOutcome } from '@ValenceClient/requests/RequestStep';
import { stageOfRequestLog } from '@ValenceClient/requests/stageOfRequestLog';
import { toneOfRequestLog } from '@ValenceClient/requests/toneOfRequestLog';

const ORDER: readonly RequestStage[] = ['release', 'search', 'download', 'import'];

const ONE_INDEXER_FAILED = 'requests.mediaRequests.indexerCouldNotAnswer';

type Run = { stage: RequestStage; lines: RequestLogEntry[] };

/**
 * The line that says how a run ended: its newest, passing over an indexer that could not answer,
 * since one indexer failing does not fail the search it was part of.
 *
 * @param run - The run.
 * @returns The line, or nothing for a run of nothing but such failures.
 */
const endOf = (run: Run): RequestLogEntry | undefined =>
  run.lines.findLast((line) => line.message.code !== ONE_INDEXER_FAILED) ?? run.lines.at(-1);

/**
 * Gathers a request's activity, oldest first, into runs of lines from the same stage, a line that
 * could come at any stage joining the run it follows.
 *
 * @param lines - The lines, oldest first.
 * @returns The runs, in order.
 */
const runsOf = (lines: readonly RequestLogEntry[]): Run[] =>
  lines.reduce<Run[]>((runs, line) => {
    const last = runs.at(-1);
    const stage = stageOfRequestLog(line) ?? last?.stage ?? 'release';

    if (last?.stage === stage) {
      last.lines.push(line);
    } else {
      runs.push({ stage, lines: [line] });
    }

    return runs;
  }, []);

/**
 * How the newest run stands: done once it has come out or been imported, failed where the line it
 * ended on is a failure, stuck where a search found nothing it would take, and under way otherwise.
 *
 * @param run - The newest run.
 * @returns How it stands.
 */
const outcomeOfNewest = (run: Run): RequestStepOutcome => {
  const { stage } = run;
  const newest = endOf(run);

  if (newest === undefined) {
    return 'current';
  }

  const tone = toneOfRequestLog(newest);

  if (tone === 'danger') {
    return 'failed';
  }

  if (stage === 'release' || (stage === 'import' && tone === 'success')) {
    return 'done';
  }

  return tone === 'highlight' ? 'stuck' : 'current';
};

/**
 * A request's activity as the steps of fetching it, first first: asking an admin where it waits on
 * one, then its coming out, finding a release, downloading it and importing it. A stage it
 * goes through more than once, as when a download fails and another release is looked for, is a step
 * each time. Each step holds its own lines and when it started and ended, and the stages still to
 * come follow as steps of their own with nothing in them yet. What it is doing right now, such as
 * which indexers a search is still waiting on, belongs to the step under way, which becomes a step of
 * its own where it has written nothing yet, the step before it then being done.
 *
 * @param request - The request, for whether it waits on an admin.
 * @param lines - Its activity, newest first, as it is read.
 * @param now - What it is doing right now, or nothing where it is between steps.
 * @returns The steps.
 */
const stepsOfRequestLog = (
  request: Pick<MediaRequest, 'approval'>,
  lines: readonly RequestLogEntry[],
  now: RequestNow = null,
): RequestStep[] => {
  if (request.approval === 'refused') {
    return [
      {
        id: 'approval',
        stage: 'approval',
        outcome: 'refused',
        lines: [],
        startedAt: null,
        endedAt: null,
        now: null,
      },
    ];
  }

  const runs = runsOf([...lines].reverse());
  const steps = runs.map((run, at): RequestStep => {
    const next = runs[at + 1];
    const first = run.lines[0];
    const end = endOf(run);
    const outcome =
      next === undefined
        ? outcomeOfNewest(run)
        : end !== undefined && toneOfRequestLog(end) === 'danger'
          ? 'failed'
          : 'done';

    return {
      id: `${run.stage}-${first?.id.toString() ?? at.toString()}`,
      stage: run.stage,
      outcome,
      lines: run.lines,
      startedAt: first?.at ?? null,
      endedAt: next?.lines[0]?.at ?? (outcome === 'done' ? (run.lines.at(-1)?.at ?? null) : null),
      now: null,
    };
  });
  const last = steps.at(-1);
  const live =
    now === null
      ? steps
      : last?.stage === now.stage
        ? [
            ...steps.slice(0, -1),
            { ...last, outcome: 'current', endedAt: null, now } satisfies RequestStep,
          ]
        : [
            ...(last === undefined
              ? []
              : [
                  ...steps.slice(0, -1),
                  last.outcome === 'current' || last.outcome === 'stuck'
                    ? ({ ...last, outcome: 'done' } satisfies RequestStep)
                    : last,
                ]),
            {
              id: `${now.stage}-now`,
              stage: now.stage,
              outcome: 'current',
              lines: [],
              startedAt: null,
              endedAt: null,
              now,
            } satisfies RequestStep,
          ];
  const newest = live.at(-1);
  const reached = newest === undefined ? -1 : ORDER.indexOf(newest.stage);
  const isComplete = newest?.stage === 'import' && newest.outcome === 'done';
  const isWaiting = request.approval === 'awaiting';
  const toCome = isComplete ? [] : ORDER.slice(reached + 1);

  return [
    ...(isWaiting
      ? [
          {
            id: 'approval',
            stage: 'approval',
            outcome: 'asks',
            lines: [],
            startedAt: null,
            endedAt: null,
            now: null,
          } satisfies RequestStep,
        ]
      : []),
    ...live,
    ...toCome.map((stage, at): RequestStep => ({
      id: `${stage}-to-come`,
      stage,
      outcome: at === 0 && !isWaiting && newest?.outcome === 'done' ? 'current' : 'later',
      lines: [],
      startedAt: null,
      endedAt: null,
      now: null,
    })),
  ];
};

export { stepsOfRequestLog };
