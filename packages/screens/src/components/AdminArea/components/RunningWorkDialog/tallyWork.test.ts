import { describe, expect, it } from 'vitest';
import { tallyWork } from './tallyWork';
import type { Job } from '@ValenceClient/admin/fetchAdmin';

const task = (id: number, state: Job['state']): Job => ({
  id,
  kind: 'thumbnails',
  subject: `File ${id.toString()}.mkv`,
  state,
  queuedAtMs: 0,
  startedAtMs: null,
  finishedAtMs: null,
  correlationId: 'run-1',
  failure: null,
});

const BAR = { label: 'Scrubs', phase: 'trickplay', processed: 16, total: 107 };

describe('tallyWork', () => {
  it('does not count finished tasks as waiting', () => {
    const tally = tallyWork(
      [BAR],
      [task(1, 'running'), task(2, 'finished'), task(3, 'finished'), task(4, 'queued')],
    );

    expect(tally).toMatchObject({ running: 1, waiting: 1 });
  });

  it('counts what the job has not yet handed to the queue from how far it has got', () => {
    expect(tallyWork([BAR], [task(1, 'running'), task(2, 'queued')]).notYetQueued).toBe(89);
  });

  it('adds up the remainder of every piece of work', () => {
    const second = { label: 'Previews', phase: 'previews', processed: 0, total: 10 };

    expect(tallyWork([BAR, second], []).notYetQueued).toBe(101);
  });

  it('does not guess at what is to come where no count is reported', () => {
    const unknown = { label: 'Scan', phase: null, processed: null, total: null };

    expect(tallyWork([unknown], [task(1, 'running')]).notYetQueued).toBe(0);
  });
});
