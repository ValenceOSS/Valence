import { describe, expect, it } from 'vitest';
import { describeJobStatus } from './describeJobStatus';

describe('describeJobStatus', () => {
  it('waits in orange while queued', () => {
    expect(describeJobStatus('queued')).toEqual({ label: 'Queued', tone: 'waiting' });
  });

  it('says running for work under way, in the colour of work under way', () => {
    expect(describeJobStatus('running')).toEqual({ label: 'Running', tone: 'busy' });
  });

  it('calls finished and completed work the same thing', () => {
    expect(describeJobStatus('finished')).toEqual({ label: 'Done', tone: 'success' });
    expect(describeJobStatus('completed')).toEqual({ label: 'Done', tone: 'success' });
  });

  it('paints what went wrong red', () => {
    expect(describeJobStatus('failed')).toEqual({ label: 'Failed', tone: 'danger' });
  });
});
