import { join, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isUnderAny } from './isUnderAny';
import { underAnyOf } from './underAnyOf';

describe('underAnyOf', () => {
  it('knows a root itself and what lies inside it, and nothing beside it', () => {
    const isLeftOut = underAnyOf([join(sep, 'media', 'Films', 'Left Out')]);

    expect(isLeftOut(join(sep, 'media', 'Films', 'Left Out'))).toBe(true);
    expect(isLeftOut(join(sep, 'media', 'Films', 'Left Out', 'Film.mkv'))).toBe(true);
    expect(isLeftOut(join(sep, 'media', 'Films', 'Left Out Too', 'Film.mkv'))).toBe(false);
    expect(isLeftOut(join(sep, 'media', 'Films'))).toBe(false);
  });

  it('answers as isUnderAny does', () => {
    const roots = ['', sep, join(sep, 'a'), join(sep, 'a', 'b'), `${join(sep, 'c')}${sep}`, 'rel'];
    const paths = [
      '',
      sep,
      join(sep, 'a'),
      join(sep, 'ab'),
      join(sep, 'a', 'b', 'c.mkv'),
      join(sep, 'c'),
      join(sep, 'c', 'd'),
      `${join(sep, 'c')}${sep}${sep}d`,
      join('rel', 'x'),
      join('relx', 'y'),
    ];

    for (let size = 0; size <= roots.length; size += 1) {
      for (let from = 0; from + size <= roots.length; from += 1) {
        const some = roots.slice(from, from + size);
        const check = underAnyOf(some);

        for (const path of paths) {
          expect(check(path), `${path} against ${JSON.stringify(some)}`).toBe(
            isUnderAny(path, some),
          );
        }
      }
    }
  });
});
