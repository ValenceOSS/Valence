import { describe, expect, it } from 'vitest';
import { bestCopyOf } from './bestCopyOf';

const copy = (id: string, height: number, libraryId = 'theirs') => ({ id, height, libraryId });

describe('bestCopyOf', () => {
  it('picks the sharpest copy on a linked server that can be reached', () => {
    expect(
      bestCopyOf(
        { height: 720 },
        [copy('a', 1080), copy('b', 2160), copy('c', 2160, 'away')],
        (libraryId) => libraryId === 'theirs',
      ),
    ).toBe('b');
  });

  it('keeps this server’s own where nothing elsewhere is sharper', () => {
    expect(bestCopyOf({ height: 1080 }, [copy('a', 1080), copy('b', 720)], () => true)).toBeNull();
  });

  it('never picks another copy of this server’s own', () => {
    expect(bestCopyOf({ height: 720 }, [copy('a', 2160, 'mine')], () => false)).toBeNull();
  });
});
