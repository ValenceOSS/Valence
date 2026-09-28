import { describe, expect, it } from 'vitest';
import { JOB_GROUPS } from '@ValenceContracts/schemas/JobGroup';
import { describeJobGroup } from './describeJobGroup';

describe('describeJobGroup', () => {
  it('names every group', () => {
    for (const group of JOB_GROUPS) {
      expect(describeJobGroup(group).length).toBeGreaterThan(0);
    }
  });

  it('calls the checks health checks', () => {
    expect(describeJobGroup('health')).toBe('Health checks');
  });
});
