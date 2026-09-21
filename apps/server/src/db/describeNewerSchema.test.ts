import { describe, expect, it } from 'vitest';
import { describeNewerSchema, HOW_TO_ROLL_BACK } from '@ValenceServer/db/describeNewerSchema';

describe('describeNewerSchema', () => {
  it('names the command that lists the snapshots', () => {
    expect(describeNewerSchema(2)).toContain(HOW_TO_ROLL_BACK);
  });

  it('counts in words that read the same for one as for several', () => {
    expect(describeNewerSchema(1)).toContain('1 migration this');
    expect(describeNewerSchema(3)).toContain('3 migrations this');
  });
});
