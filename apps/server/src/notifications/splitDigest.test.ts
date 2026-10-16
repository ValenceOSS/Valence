import { describe, expect, it } from 'vitest';
import { splitDigest } from './splitDigest';
import type { AddedItem } from './summariseNewMedia';

const item = (id: string, seriesId: string | null = null): AddedItem => ({
  id,
  title: id,
  seriesId,
  seriesTitle: seriesId,
  albumId: null,
  albumTitle: null,
});

describe('splitDigest', () => {
  it('tells everybody of everything where nobody asked for any of it', () => {
    expect(splitDigest([item('a')], new Map([['sam', new Set(['z'])]]))).toEqual([
      { items: [item('a')] },
    ]);
  });

  it('leaves out what somebody asked for, for them alone', () => {
    const items = [item('a', 'show'), item('b')];

    expect(splitDigest(items, new Map([['sam', new Set(['show'])]]))).toEqual([
      { items, except: ['sam'] },
      { items: [item('b')], only: ['sam'] },
    ]);
  });
});
