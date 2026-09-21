import { describe, expect, it } from 'vitest';
import { readObservabilityView } from './readObservabilityView';

describe('readObservabilityView', () => {
  it.each(['logs', 'jobs', 'health', 'run'] as const)(
    'opens on %s where the address says so',
    (view) => {
      expect(readObservabilityView(view, 'jobs')).toBe(view);
    },
  );

  it('opens the old logs address on the log', () => {
    expect(readObservabilityView(undefined, 'logs')).toBe('logs');
  });

  it('lets an explicit view win over the address it came in on', () => {
    expect(readObservabilityView('health', 'logs')).toBe('health');
  });

  it('leaves the choice to the page where nothing was asked for, or what was asked for is not a view', () => {
    expect(readObservabilityView(undefined, 'jobs')).toBeUndefined();
    expect(readObservabilityView('gibberish', 'jobs')).toBeUndefined();
  });
});
