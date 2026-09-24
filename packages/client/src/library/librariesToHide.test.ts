import { describe, expect, it } from 'vitest';
import { librariesToHide } from './librariesToHide';
import type { Hidden } from '@ValenceContracts/schemas/Hidden';

const hidden = (overrides: Partial<Hidden> = {}): Hidden => ({
  kind: 'library',
  subjectId: 'library-2',
  title: 'Shows',
  hiddenAt: '2026-09-23T00:00:00.000Z',
  ...overrides,
});

describe('librariesToHide', () => {
  it('offers every library the server still lists', () => {
    expect(librariesToHide([{ id: 'library-1', name: 'Films' }], [])).toEqual([
      { id: 'library-1', name: 'Films' },
    ]);
  });

  it('keeps a hidden library the server no longer lists, in name order', () => {
    expect(
      librariesToHide(
        [
          { id: 'library-1', name: 'Books' },
          { id: 'library-3', name: 'Storage' },
        ],
        [hidden()],
      ),
    ).toEqual([
      { id: 'library-1', name: 'Books' },
      { id: 'library-2', name: 'Shows' },
      { id: 'library-3', name: 'Storage' },
    ]);
  });

  it('does not offer a library twice while the server catches up', () => {
    expect(librariesToHide([{ id: 'library-2', name: 'Shows' }], [hidden()])).toEqual([
      { id: 'library-2', name: 'Shows' },
    ]);
  });

  it('leaves hidden titles and programmes out', () => {
    expect(
      librariesToHide([], [hidden({ kind: 'series' }), hidden({ kind: 'item', subjectId: 'x' })]),
    ).toEqual([]);
  });
});
