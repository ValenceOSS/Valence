import { describe, expect, it } from 'vitest';
import { namesOfJobs } from './namesOfJobs';

describe('namesOfJobs', () => {
  it('names each person who did one of the jobs once, in order', () => {
    expect(
      namesOfJobs(
        [
          { name: 'One', job: 'Screenplay' },
          { name: 'Two', job: 'Director' },
          { name: 'One', job: 'Story' },
          { name: 'Three' },
        ],
        (job) => job === 'Screenplay' || job === 'Story',
      ),
    ).toEqual(['One']);
  });
});
