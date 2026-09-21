import { describe, expect, it } from 'vitest';
import { readObservabilityView } from './readObservabilityView';

describe('readObservabilityView', () => {
  it.each(['logs', 'jobs', 'health', 'run'] as const)(
    'opens on %s where the address says so',
    (view) => {
      expect(readObservabilityView(view, 'logs')).toBe(view);
    },
  );

  it('opens the old jobs address on the job runs', () => {
    expect(readObservabilityView(undefined, 'jobs')).toBe('jobs');
  });

  it('lets an explicit view win over the address it came in on', () => {
    expect(readObservabilityView('health', 'jobs')).toBe('health');
  });

  it('leaves the choice to the page where nothing was asked for, or what was asked for is not a view', () => {
    expect(readObservabilityView(undefined, 'logs')).toBeUndefined();
    expect(readObservabilityView('gibberish', 'logs')).toBeUndefined();
  });
});
