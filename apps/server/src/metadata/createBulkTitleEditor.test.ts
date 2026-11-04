import { describe, expect, it, vi } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, series } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createBulkTitleEditor } from './createBulkTitleEditor';
import type { TitleEditRequest, TitleMetadata } from '@ValenceContracts/schemas/TitleEdit';
import type { Actor } from './createTitleEditStore';

const STARTING_DATABASE_MS = 60_000;

const ACTOR = { id: null, name: 'Admin' };

/**
 * A film's metadata as the editor reads it.
 *
 * @param key - The film's key.
 * @param fields - Its fields.
 * @returns The metadata.
 */
const aFilm = (key: string, fields: TitleMetadata['fields']): TitleMetadata => ({
  subject: { kind: 'film', key, libraryId: 'lib', isMatched: true },
  fields,
});

/**
 * An editor over two films, Heat and Alien, recording each edit asked of it.
 *
 * @returns The editor and what it was asked.
 */
const anEditor = async () => {
  const held: Record<string, TitleMetadata> = {
    heat: aFilm('movie:1', {
      title: { value: 'The Heat', source: 'catalogue' },
      sortTitle: { value: null, source: 'catalogue' },
      tags: { value: ['heist'], source: 'catalogue' },
      tagline: { value: 'A line', source: 'catalogue' },
      certifications: { value: { US: 'R' }, source: 'catalogue' },
    }),
    alien: aFilm('movie:2', {
      title: { value: 'Alien', source: 'catalogue' },
      sortTitle: { value: null, source: 'catalogue' },
      tags: { value: [], source: 'catalogue' },
      tagline: { value: 'Another', source: 'locked' },
      certifications: { value: {}, source: 'catalogue' },
    }),
  };
  const edit = vi.fn(
    (_mediaId: string, _scope: string, _request: TitleEditRequest, _actor: Actor, set?: string) =>
      Promise.resolve({ changeSetId: set ?? 'set', metadata: held.heat ?? aFilm('x', {}) }),
  );
  const undo = vi.fn(
    (): Promise<{ changeSetId: string | null; metadata: TitleMetadata } | string> =>
      Promise.resolve({ changeSetId: null, metadata: aFilm('x', {}) }),
  );
  const editor = createBulkTitleEditor({
    db: await aMigratedDatabase(),
    read: (mediaId) => Promise.resolve(held[mediaId] ?? 'missing'),
    edit,
    undo,
  });

  return { editor, edit, undo };
};

const BOTH = [
  { mediaId: 'heat', scope: 'title' },
  { mediaId: 'alien', scope: 'title' },
] as const;

describe('createBulkTitleEditor', { timeout: STARTING_DATABASE_MS }, () => {
  it('reads each field’s shared value, saying where the titles differ', async () => {
    const { editor } = await anEditor();
    const read = await editor.readMany({ targets: [...BOTH], appliesTo: 'titles' });

    expect(read.titles).toBe(2);
    expect(read.fields.sortTitle).toEqual({ value: null, isMixed: false, titles: 2 });
    expect(read.fields.tags).toEqual({ value: null, isMixed: true, titles: 2 });
  });

  it('works the change out for each title from what it holds, all under one change set', async () => {
    const { editor, edit } = await anEditor();
    const outcome = await editor.editMany(
      {
        targets: [...BOTH],
        appliesTo: 'titles',
        change: {
          add: { tags: ['Heist', 'classic'] },
          clear: ['tagline'],
          sortTitleFromTitle: true,
          contentRating: { region: 'GB', rating: '15' },
        },
      },
      ACTOR,
    );
    const asked = edit.mock.calls.map(([mediaId, , request, , set]) => ({ mediaId, request, set }));

    expect(asked).toEqual([
      {
        mediaId: 'heat',
        set: outcome.changeSetId,
        request: {
          set: {
            tagline: null,
            tags: ['heist', 'classic'],
            certifications: { US: 'R', GB: '15' },
            sortTitle: 'Heat',
          },
        },
      },
      {
        mediaId: 'alien',
        set: outcome.changeSetId,
        request: {
          set: {
            tagline: null,
            tags: ['Heist', 'classic'],
            certifications: { GB: '15' },
            sortTitle: 'Alien',
          },
        },
      },
    ]);
    expect(outcome.changed).toHaveLength(2);
  });

  it('locks every field, or lets the locked ones follow the catalogue again', async () => {
    const { editor, edit } = await anEditor();

    await editor.editMany(
      { targets: [BOTH[1]], appliesTo: 'titles', change: { unlockAll: true } },
      ACTOR,
    );
    await editor.editMany(
      { targets: [BOTH[0]], appliesTo: 'titles', change: { lockAll: true } },
      ACTOR,
    );

    expect(edit.mock.calls[0]?.[2]).toEqual({ reset: ['tagline'] });
    expect(edit.mock.calls[1]?.[2]).toEqual({
      lock: ['title', 'sortTitle', 'tags', 'tagline', 'certifications'],
    });
  });

  it('leaves a title alone where the change asks nothing of it, and counts one it cannot read', async () => {
    const { editor, edit } = await anEditor();
    const outcome = await editor.editMany(
      {
        targets: [{ mediaId: 'gone', scope: 'title' }, BOTH[0]],
        appliesTo: 'titles',
        change: { remove: { tags: ['nothing like it'] } },
      },
      ACTOR,
    );

    expect(edit).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ changed: [], unchanged: 1, refused: 1 });
  });

  it('undoes every title or none, refusing where one changed since', async () => {
    const { editor, undo } = await anEditor();

    undo.mockResolvedValueOnce({ changeSetId: null, metadata: aFilm('x', {}) });
    undo.mockImplementationOnce(() => Promise.resolve('changedSince'));

    await expect(
      editor.undoMany(
        { changeSetId: '00000000-0000-4000-8000-000000000001', targets: [...BOTH] },
        ACTOR,
      ),
    ).resolves.toBe('changedSince');
    expect(undo).toHaveBeenCalledTimes(2);
  });

  it('edits every episode of the programmes chosen, where asked', async () => {
    const db = await aMigratedDatabase();

    await db.insert(library).values({ id: 'lib', name: 'Shows', kind: 'shows', path: '/lib' });
    await db
      .insert(series)
      .values({ id: 'show', libraryId: 'lib', key: 'folder:Show', title: 'Show' });
    await db.insert(mediaItem).values([
      {
        ...aMediaItemRow('one', 'lib'),
        seriesId: 'show',
        seriesTitle: 'Show',
        seasonNumber: 1,
        episodeNumber: 1,
      },
      {
        ...aMediaItemRow('two', 'lib'),
        seriesId: 'show',
        seriesTitle: 'Show',
        seasonNumber: 1,
        episodeNumber: 2,
      },
    ]);

    const read = vi.fn((mediaId: string) =>
      Promise.resolve({
        subject: { kind: 'episode' as const, key: mediaId, libraryId: 'lib', isMatched: true },
        fields: { overview: { value: 'x', source: 'catalogue' as const } },
      }),
    );
    const editor = createBulkTitleEditor({
      db,
      read,
      edit: () => Promise.resolve('missing'),
      undo: () => Promise.resolve('missing'),
    });

    await editor.readMany({ targets: [{ mediaId: 'one', scope: 'title' }], appliesTo: 'episodes' });

    expect(read.mock.calls.map(([id]) => id).sort()).toEqual(['one', 'two']);
  });
});
