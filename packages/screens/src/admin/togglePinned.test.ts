import { describe, expect, it } from 'vitest';
import { togglePinned } from './togglePinned';

describe('togglePinned', () => {
  it('pins at the end', () => {
    expect(togglePinned(['jobs'], 'downloads')).toEqual(['jobs', 'downloads']);
  });

  it('unpins a page pinned already', () => {
    expect(togglePinned(['jobs', 'downloads'], 'jobs')).toEqual(['downloads']);
  });
});
