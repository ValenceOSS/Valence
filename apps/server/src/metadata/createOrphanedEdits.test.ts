import { describe, expect, it, vi } from 'vitest';
import { createOrphanedEdits } from './createOrphanedEdits';

const AT = new Date('2026-11-01T00:00:00.000Z');

/**
 * Orphaned edits over a library holding one programme, with edits kept for it and for a film and a
 * programme whose files have gone.
 *
 * @returns The finder and how it moves and throws away edits.
 */
const aFinder = () => {
  const move = vi.fn(() => Promise.resolve(2));
  const forget = vi.fn(() => Promise.resolve(3));
  const finder = createOrphanedEdits({
    subjects: () =>
      Promise.resolve([
        { key: 'tv:1', kind: 'show', fields: 1, setAt: AT, name: null },
        { key: 'movie:9', kind: 'film', fields: 2, setAt: AT, name: 'Gone Film' },
        { key: 'tv:7', kind: 'show', fields: 1, setAt: AT, name: 'Gone Show' },
        { key: 'tv:7:s1', kind: 'season', fields: 1, setAt: AT, name: null },
        { key: 'tv:7:s1e2', kind: 'episode', fields: 1, setAt: AT, name: 'Pilot' },
      ]),
    titles: () =>
      Promise.resolve([
        { key: 'tv:1', id: 'series lib one', name: 'Here', leadId: 'e1', kind: 'show' as const },
      ]),
    move,
    forget,
  });

  return { finder, move, forget };
};

describe('createOrphanedEdits', () => {
  it('lists each title whose files have gone once, its seasons’ and episodes’ edits counted in', async () => {
    const { finder } = aFinder();
    const { orphans } = await finder.list('lib');

    expect(orphans.map((one) => [one.key, one.kind, one.fields, one.name]).sort()).toEqual([
      ['movie:9', 'film', 2, 'Gone Film'],
      ['tv:7', 'show', 3, 'Gone Show'],
    ]);
  });

  it('moves a gone programme’s edits onto one still here, each season and episode with it', async () => {
    const { finder, move } = aFinder();

    await expect(finder.attach('lib', 'tv:7', 'series lib one')).resolves.toBe(2);
    expect(move).toHaveBeenCalledWith('lib', [
      { from: 'tv:7', to: 'tv:1', kind: 'show' },
      { from: 'tv:7:s1', to: 'tv:1:s1', kind: 'season' },
      { from: 'tv:7:s1e2', to: 'tv:1:s1e2', kind: 'episode' },
    ]);
  });

  it('refuses to attach to a title not there', async () => {
    const { finder } = aFinder();

    await expect(finder.attach('lib', 'tv:7', 'nothing')).resolves.toBeNull();
  });

  it('throws away a gone title’s edits, its seasons’ and episodes’ with them', async () => {
    const { finder, forget } = aFinder();

    await finder.throwAway('lib', 'tv:7');

    expect(forget).toHaveBeenCalledWith('lib', ['tv:7', 'tv:7:s1', 'tv:7:s1e2']);
  });
});
