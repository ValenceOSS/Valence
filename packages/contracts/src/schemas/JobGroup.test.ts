import { describe, expect, it } from 'vitest';
import { JOB_GROUPS, JobGroupSchema } from './JobGroup';

describe('JobGroupSchema', () => {
  it('reads each group by name', () => {
    for (const group of JOB_GROUPS) {
      expect(JobGroupSchema.parse(group)).toBe(group);
    }
  });

  it('refuses a group that does not exist', () => {
    expect(JobGroupSchema.safeParse('misc').success).toBe(false);
  });
});
