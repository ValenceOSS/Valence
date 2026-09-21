import { describe, expect, it } from 'vitest';
import { createJobEventLog } from './createJobEventLog';
import type { Logger } from './Logger';
import type { LogContext, LogSource } from '@ValenceContracts/schemas/Log';

type Said = {
  level: string;
  source: LogSource;
  message: string;
  context: Partial<LogContext> | undefined;
};

const aLogger = () => {
  const said: Said[] = [];
  const write =
    (level: string) =>
    (source: LogSource, message: string, aside?: { context?: Partial<LogContext> }) => {
      said.push({ level, source, message, context: aside?.context });
    };
  const log: Logger = {
    debug: write('debug'),
    info: write('info'),
    warn: write('warn'),
    error: write('error'),
    about: () => log,
    flush: () => Promise.resolve(),
  };

  return { log, said };
};

const LABELS = new Map([['library.detectSegments', 'Detect missing intros and outros']]);

const build = (start = 1000) => {
  const { log, said } = aLogger();
  let now = start;
  const events = createJobEventLog(
    log,
    (kind) => LABELS.get(kind) ?? kind,
    () => now,
  );

  return {
    said,
    events,
    later: (ms: number) => {
      now += ms;
    },
  };
};

const KIND = 'library.detectSegments';

describe('createJobEventLog', () => {
  it('says a job started, in words, and for what', () => {
    const { events, said } = build();

    events.started({ kind: KIND, jobId: 'j1', subject: 'Movies' });

    expect(said).toStrictEqual([
      {
        level: 'info',
        source: 'jobs',
        message: 'Detect missing intros and outros started on Movies',
        context: { jobId: 'j1', jobKind: KIND },
      },
    ]);
  });

  it('says a job started without saying what for where it was for nothing in particular', () => {
    const { events, said } = build();

    events.started({ kind: 'server.checkDiskSpace', jobId: 'j1', subject: null });

    expect(said[0]?.message).toBe('server.checkDiskSpace started');
  });

  it('says how far it has got when it first reports, and at each tenth of the way after', () => {
    const { events, said } = build();

    events.started({ kind: KIND, jobId: 'j1', subject: null });
    said.length = 0;

    for (const processed of [1, 5, 10, 11, 20, 22, 107]) {
      events.progress({ jobId: 'j1', phase: 'segments', processed, total: 107, item: null });
    }

    expect(said.map((line) => line.message)).toStrictEqual([
      'Detect missing intros and outros: segments — 1 of 107',
      'Detect missing intros and outros: segments — 11 of 107',
      'Detect missing intros and outros: segments — 22 of 107',
      'Detect missing intros and outros: segments — 107 of 107',
    ]);
  });

  it('says it again when the job moves on to another phase', () => {
    const { events, said } = build();

    events.started({ kind: KIND, jobId: 'j1', subject: null });
    said.length = 0;
    events.progress({ jobId: 'j1', phase: 'reading', processed: 5, total: 10, item: null });
    events.progress({ jobId: 'j1', phase: 'writing', processed: 0, total: 10, item: null });

    expect(said.map((line) => line.message)).toStrictEqual([
      'Detect missing intros and outros: reading — 5 of 10',
      'Detect missing intros and outros: writing — 0 of 10',
    ]);
  });

  it('writes what it is working on at the debug level, so it can be left out', () => {
    const { events, said } = build();

    events.started({ kind: KIND, jobId: 'j1', subject: null });
    said.length = 0;
    events.progress({
      jobId: 'j1',
      phase: 'previews',
      processed: 1,
      total: 4,
      item: 'Dune (2021)',
    });

    expect(said[0]).toMatchObject({ level: 'debug', message: 'previews: Dune (2021)' });
  });

  it('gives every line the job it belongs to', () => {
    const { events, said } = build();

    events.started({ kind: KIND, jobId: 'j1', subject: null });
    events.progress({ jobId: 'j1', phase: 'segments', processed: 1, total: 2, item: null });
    events.finished({ kind: KIND, jobId: 'j1', reason: null });

    expect(said.every((line) => line.context?.jobId === 'j1')).toBe(true);
    expect(said.every((line) => line.context?.jobKind === KIND)).toBe(true);
  });

  it('says how long a job took when it finished well', () => {
    const { events, said, later } = build();

    events.started({ kind: KIND, jobId: 'j1', subject: null });
    later(12_340);
    events.finished({ kind: KIND, jobId: 'j1', reason: null });

    expect(said.at(-1)).toMatchObject({
      level: 'info',
      message: 'Detect missing intros and outros finished after 12.3 s',
    });
  });

  it('says why a job failed, as an error, and how long it went on for', () => {
    const { events, said, later } = build();

    events.started({ kind: KIND, jobId: 'j1', subject: null });
    later(2000);
    events.finished({ kind: KIND, jobId: 'j1', reason: 'no such encoder' });

    expect(said.at(-1)).toMatchObject({
      level: 'error',
      message: 'Detect missing intros and outros failed after 2 s: no such encoder',
    });
  });

  it('says a job finished even where it was never seen to start', () => {
    const { events, said } = build();

    events.finished({ kind: KIND, jobId: 'unseen', reason: null });

    expect(said[0]?.message).toBe('Detect missing intros and outros finished');
  });

  it('picks up a job it did not see start, at its first report of progress', () => {
    const { events, said } = build();

    events.progress({ jobId: 'unseen', phase: 'previews', processed: 28, total: 107, item: null });

    expect(said).toStrictEqual([
      {
        level: 'info',
        source: 'jobs',
        message: 'A background job: previews — 28 of 107',
        context: { jobId: 'unseen' },
      },
    ]);
  });

  it('forgets a job once it has finished, so what it was is not carried into another run', () => {
    const { events, said } = build();

    events.started({ kind: KIND, jobId: 'j1', subject: null });
    events.finished({ kind: KIND, jobId: 'j1', reason: null });
    said.length = 0;
    events.progress({ jobId: 'j1', phase: 'x', processed: 1, total: 2, item: null });

    expect(said[0]?.message).toBe('A background job: x — 1 of 2');
  });

  it('keeps each job’s progress apart from the others', () => {
    const { events, said } = build();

    events.started({ kind: KIND, jobId: 'a', subject: null });
    events.started({ kind: 'library.scan', jobId: 'b', subject: null });
    said.length = 0;
    events.progress({ jobId: 'a', phase: 'p', processed: 5, total: 10, item: null });
    events.progress({ jobId: 'b', phase: 'p', processed: 1, total: 10, item: null });

    expect(said.map((line) => line.context?.jobId)).toStrictEqual(['a', 'b']);
  });

  it('does not divide by nothing where a job has no total yet', () => {
    const { events, said } = build();

    events.started({ kind: KIND, jobId: 'j1', subject: null });
    said.length = 0;
    events.progress({ jobId: 'j1', phase: 'p', processed: 0, total: 0, item: null });

    expect(said).toHaveLength(1);
  });
});
