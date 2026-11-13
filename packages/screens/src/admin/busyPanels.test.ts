import { describe, expect, it } from 'vitest';
import type { Job } from '@ValenceClient/admin/fetchAdmin';
import { busyPanels } from '@ValenceScreens/admin/busyPanels';

const job = (kind: string, state: Job['state'] = 'running'): Job => ({
  id: 1,
  kind,
  subject: '',
  state,
  queuedAtMs: 0,
  startedAtMs: 0,
  finishedAtMs: null,
  correlationId: null,
  stoppedBecause: null,
  failure: null,
});

describe('busyPanels', () => {
  it('is empty while nothing runs', () => {
    expect(busyPanels([job('library.scan', 'queued'), job('preview', 'finished')]).size).toBe(0);
  });

  it('puts a library job on the libraries page and the jobs page', () => {
    expect([...busyPanels([job('library.scan')])].sort()).toEqual(['jobs', 'libraries']);
  });

  it('puts the media service work on the media and encoding pages', () => {
    const busy = busyPanels([job('creditFrames'), job('renditions')]);

    expect(busy.has('media')).toBe(true);
    expect(busy.has('encoding')).toBe(true);
  });

  it('shows an unfamiliar job on the jobs page alone', () => {
    expect([...busyPanels([job('somethingNew')])]).toEqual(['jobs']);
  });
});
