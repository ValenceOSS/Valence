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

  it('checks fifty thousand paths against a thousand roots in no time', () => {
    const check = underAnyOf(
      Array.from({ length: 1000 }, (_, at) => join(sep, 'media', `Left Out ${at.toString()}`)),
    );
    const started = performance.now();

    for (let at = 0; at < 50_000; at += 1) {
      check(join(sep, 'media', 'Films', `Film ${at.toString()}`, 'Film.mkv'));
    }

    expect(performance.now() - started).toBeLessThan(250);
  });
});
