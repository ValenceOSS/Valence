import { describe, expect, it, vi } from 'vitest';
import { movePhotographsOnce } from './movePhotographsOnce';
import type { PhotographFileSystem } from './movePhotographsOnce';

const OLD = '/cache/images/profiles';
const NEW = '/config/profiles';

const filesHolding = (
  held: Record<string, string[]>,
  overrides: Partial<PhotographFileSystem> = {},
) => {
  const moves: [string, string][] = [];

  const files: PhotographFileSystem = {
    list: (directory) => Promise.resolve(held[directory] ?? []),
    ensure: () => Promise.resolve(),
    has: (path) =>
      Promise.resolve(
        (held[path.slice(0, path.lastIndexOf('/'))] ?? []).includes(
          path.slice(path.lastIndexOf('/') + 1),
        ),
      ),
    move: (fromPath, toPath) => {
      moves.push([fromPath, toPath]);

      return Promise.resolve();
    },
    ...overrides,
  };

  return { files, moves };
};

describe('moving profile photographs off the cache', () => {
  it('moves every face it finds to where it will be kept', async () => {
    const { files, moves } = filesHolding({ [OLD]: ['one.jpg', 'two.png'] });

    await expect(movePhotographsOnce({ from: OLD, to: NEW, files })).resolves.toBe(2);
    expect(moves).toEqual([
      [`${OLD}/one.jpg`, `${NEW}/one.jpg`],
      [`${OLD}/two.png`, `${NEW}/two.png`],
    ]);
  });

  it('does nothing at all on every boot after the first', async () => {
    const { files, moves } = filesHolding({});

    await expect(movePhotographsOnce({ from: OLD, to: NEW, files })).resolves.toBe(0);
    expect(moves).toEqual([]);
  });

  it('does nothing where the two are the same place', async () => {
    const { files, moves } = filesHolding({ [OLD]: ['one.jpg'] });

    await expect(movePhotographsOnce({ from: OLD, to: OLD, files })).resolves.toBe(0);
    expect(moves).toEqual([]);
  });

  it('leaves a face already moved alone rather than writing over it', async () => {
    const { files, moves } = filesHolding({ [OLD]: ['one.jpg', 'two.png'], [NEW]: ['one.jpg'] });

    await expect(movePhotographsOnce({ from: OLD, to: NEW, files })).resolves.toBe(1);
    expect(moves).toEqual([[`${OLD}/two.png`, `${NEW}/two.png`]]);
  });

  it('carries on past one it cannot move, and says which', async () => {
    const onProblem = vi.fn();
    const { files } = filesHolding(
      { [OLD]: ['one.jpg', 'two.png'] },
      {
        move: (fromPath) =>
          fromPath.endsWith('one.jpg')
            ? Promise.reject(new Error('Permission denied'))
            : Promise.resolve(),
      },
    );

    await expect(movePhotographsOnce({ from: OLD, to: NEW, files, onProblem })).resolves.toBe(1);
    expect(onProblem).toHaveBeenCalledWith('one.jpg', 'Permission denied');
  });
});
