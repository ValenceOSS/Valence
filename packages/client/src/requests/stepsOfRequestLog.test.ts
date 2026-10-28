import { describe, expect, it } from 'vitest';
import { stepsOfRequestLog } from './stepsOfRequestLog';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { RequestLogEntry } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestNow } from '@ValenceContracts/schemas/RequestNow';

const REQUESTS = 'requests.mediaRequests';

const WORKER = `${REQUESTS}.requestWorker`;

const HAND_OFF = 'requests.arrApps.handOff';

/**
 * A said line of the code given, holding the parts given.
 */
const said = (code: string | null, values: Said['values'] = {}): Said => ({
  code,
  message: code ?? 'Note',
  values,
});

/**
 * The moment the given number of minutes into the day the request was made.
 */
const minute = (at: number): string => new Date(Date.UTC(2026, 9, 9, 17, at)).toISOString();

/**
 * A request's activity, given oldest first, as it is read: newest first, each line a minute apart.
 */
const logOf = (...messages: Said[]): RequestLogEntry[] =>
  messages
    .map((message, at): RequestLogEntry => ({
      id: at + 1,
      at: minute(at),
      message,
      problemCode: null,
    }))
    .reverse();

const WANTED = said(`${WORKER}.itIsOutAndWanted`);

const SEARCHING = said(`${REQUESTS}.searched`);

const CHOSE = said(`${REQUESTS}.searched`, {
  outcome: said(`${WORKER}.choseTitleTheBestOfForIt`, { forIt: 3 }),
});

const NONE_WOULD_DO = said(`${REQUESTS}.searched`, {
  outcome: said(`${WORKER}.nothingAcceptableHasBeenFoundYet`),
});

const INDEXER_FAILED = said(`${REQUESTS}.indexerCouldNotAnswer`);

const HANDED = said(`${HAND_OFF}.handedToName`);

const DOWNLOAD_FAILED = said(`${WORKER}.stoppedTitleAndLookingForAnother`);

const FILED = said(`${WORKER}.filedSizeFromTitleIntoFolder`);

const NOT_FILED = said(`${REQUESTS}.couldNotBeFiled`);

const APPROVED = { approval: 'approved' } as const;

const SEARCH_NOW: RequestNow = {
  stage: 'search',
  startedAt: minute(10),
  indexers: [{ name: 'Nyaa', state: 'asking', found: 0 }],
};

/**
 * How each step of the request's activity stands, as stage and outcome.
 */
const shapeOf = (...steps: Parameters<typeof stepsOfRequestLog>) =>
  stepsOfRequestLog(...steps).map(({ stage, outcome }) => `${stage}:${outcome}`);

describe('stepsOfRequestLog', () => {
  it('runs from its coming out to its import, each done once the next has begun', () => {
    const steps = stepsOfRequestLog(APPROVED, logOf(WANTED, CHOSE, HANDED, FILED));

    expect(steps.map(({ stage, outcome }) => `${stage}:${outcome}`)).toEqual([
      'release:done',
      'search:done',
      'download:done',
      'import:done',
    ]);
    expect(steps.map(({ id }) => id)).toEqual(['release-1', 'search-2', 'download-3', 'import-4']);
    expect(steps[1]?.startedAt).toBe(minute(1));
    expect(steps[1]?.endedAt).toBe(minute(2));
    expect(steps[3]?.endedAt).toBe(minute(3));
  });

  it('gathers lines of the same stage, and lines of no stage, into the step they follow', () => {
    const steps = stepsOfRequestLog(
      APPROVED,
      logOf(WANTED, SEARCHING, said(`${WORKER}.stoppedByAnAdmin`), SEARCHING, HANDED),
    );

    expect(steps[1]?.lines.map(({ id }) => id)).toEqual([2, 3, 4]);
    expect(steps[1]?.endedAt).toBe(minute(4));
  });

  it('starts at its coming out where its first line could come at any stage', () => {
    expect(shapeOf(APPROVED, logOf(said(null), SEARCHING))[0]).toBe('release:done');
  });

  it('has the step under way as current, with the stages still to come later', () => {
    const steps = stepsOfRequestLog(APPROVED, logOf(WANTED, CHOSE, HANDED));

    expect(steps.map(({ stage, outcome }) => `${stage}:${outcome}`)).toEqual([
      'release:done',
      'search:done',
      'download:current',
      'import:later',
    ]);
    expect(steps[2]?.endedAt).toBeNull();
    expect(steps[3]).toMatchObject({ id: 'import-to-come', lines: [], startedAt: null });
  });

  it('moves straight on to looking for a release once it has come out', () => {
    expect(shapeOf(APPROVED, logOf(WANTED))).toEqual([
      'release:done',
      'search:current',
      'download:later',
      'import:later',
    ]);
  });

  it('is stuck where a search found nothing it would take', () => {
    expect(shapeOf(APPROVED, logOf(WANTED, NONE_WOULD_DO))).toEqual([
      'release:done',
      'search:stuck',
      'download:later',
      'import:later',
    ]);
  });

  it('fails where the newest line is a failure', () => {
    expect(shapeOf(APPROVED, logOf(WANTED, CHOSE, HANDED, NOT_FILED))).toEqual([
      'release:done',
      'search:done',
      'download:done',
      'import:failed',
    ]);
  });

  it('is a step each time, when a failed download sends it looking for another release', () => {
    const steps = stepsOfRequestLog(
      APPROVED,
      logOf(WANTED, CHOSE, HANDED, DOWNLOAD_FAILED, SEARCHING),
    );

    expect(steps.map(({ stage, outcome }) => `${stage}:${outcome}`)).toEqual([
      'release:done',
      'search:done',
      'download:failed',
      'search:current',
      'download:later',
      'import:later',
    ]);
    expect(steps[2]?.endedAt).toBe(minute(4));
    expect(steps[3]?.id).toBe('search-5');
  });

  it('does not fail a search because one indexer could not answer', () => {
    expect(shapeOf(APPROVED, logOf(WANTED, SEARCHING, INDEXER_FAILED))[1]).toBe('search:current');
    expect(shapeOf(APPROVED, logOf(WANTED, CHOSE, INDEXER_FAILED, HANDED))[1]).toBe('search:done');
  });

  it('fails a search where no indexer could answer', () => {
    expect(shapeOf(APPROVED, logOf(INDEXER_FAILED, INDEXER_FAILED))).toEqual([
      'search:failed',
      'download:later',
      'import:later',
    ]);
  });

  it('asks an admin first where it waits on one, the rest still to come', () => {
    const steps = stepsOfRequestLog({ approval: 'awaiting' }, []);

    expect(steps.map(({ stage, outcome }) => `${stage}:${outcome}`)).toEqual([
      'approval:asks',
      'release:later',
      'search:later',
      'download:later',
      'import:later',
    ]);
    expect(steps[0]?.id).toBe('approval');
  });

  it('keeps the next stage later while it waits on an admin, even after one is done', () => {
    expect(shapeOf({ approval: 'awaiting' }, logOf(WANTED))).toEqual([
      'approval:asks',
      'release:done',
      'search:later',
      'download:later',
      'import:later',
    ]);
  });

  it('is only refused once an admin has refused it', () => {
    expect(stepsOfRequestLog({ approval: 'refused' }, logOf(WANTED, SEARCHING))).toEqual([
      {
        id: 'approval',
        stage: 'approval',
        outcome: 'refused',
        lines: [],
        startedAt: null,
        endedAt: null,
        now: null,
      },
    ]);
  });

  it('gives what it is doing now to the step under way, which is current again', () => {
    const steps = stepsOfRequestLog(APPROVED, logOf(WANTED, NONE_WOULD_DO), SEARCH_NOW);

    expect(steps[1]).toMatchObject({
      id: 'search-2',
      stage: 'search',
      outcome: 'current',
      endedAt: null,
      now: SEARCH_NOW,
    });
    expect(steps[1]?.lines).toHaveLength(1);
    expect(steps[0]?.now).toBeNull();
  });

  it('makes what it is doing now a step of its own where it has written nothing for it yet', () => {
    const steps = stepsOfRequestLog(APPROVED, logOf(WANTED), SEARCH_NOW);

    expect(steps.map(({ stage, outcome }) => `${stage}:${outcome}`)).toEqual([
      'release:done',
      'search:current',
      'download:later',
      'import:later',
    ]);
    expect(steps[1]).toEqual({
      id: 'search-now',
      stage: 'search',
      outcome: 'current',
      lines: [],
      startedAt: null,
      endedAt: null,
      now: SEARCH_NOW,
    });
  });

  it('finishes the step before what it is doing now, so only one step is under way', () => {
    const downloading: RequestNow = {
      stage: 'download',
      title: 'Dune',
      clientName: 'qBittorrent',
      downloadId: '00000000-0000-4000-8000-000000000001',
      state: 'downloading',
      progress: 0.4,
      sizeBytes: 100,
      doneBytes: 40,
      downloadBytesPerSecond: null,
      secondsLeft: null,
    };

    expect(shapeOf(APPROVED, logOf(WANTED, CHOSE), downloading)).toEqual([
      'release:done',
      'search:done',
      'download:current',
      'import:later',
    ]);
  });

  it('has the stages after what it is doing now still to come', () => {
    const importing: RequestNow = { stage: 'import', title: 'Dune' };

    expect(shapeOf(APPROVED, [], importing)).toEqual(['import:current']);
    expect(shapeOf(APPROVED, [], SEARCH_NOW)).toEqual([
      'search:current',
      'download:later',
      'import:later',
    ]);
  });
});
