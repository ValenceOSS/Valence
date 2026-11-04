import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, user } from '#dialect/Schema';
import { createTitleEditStore } from './createTitleEditStore';

const STARTING_DATABASE_MS = 60_000;

const FILM = { libraryId: 'films', key: 'movie:603', kind: 'film' as const };

const ADA = { id: 'ada', name: 'Ada' };

/**
 * A store over a fresh database holding one library and one account.
 *
 * @returns The store.
 */
const aStore = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
  await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/films' });

  return createTitleEditStore(db);
};

describe('createTitleEditStore', () => {
  it(
    'keeps an edit with the catalogue’s value under it, and its change as one change set',
    async () => {
      const store = await aStore();
      const changeSetId = await store.change(
        FILM,
        [
          { field: 'title', edit: { value: 'My title', catalogue: 'A film' } },
          { field: 'tags', edit: { value: ['Kept'], catalogue: null } },
        ],
        ADA,
        'set',
      );

      expect(changeSetId).not.toBeNull();
      await expect(store.editsFor('films', ['movie:603'])).resolves.toMatchObject([
        { field: 'tags', value: ['Kept'], catalogue: null },
        { field: 'title', value: 'My title', catalogue: 'A film', setBy: 'ada' },
      ]);
      await expect(store.history('films', 'movie:603')).resolves.toMatchObject([
        {
          changeSetId,
          by: 'Ada',
          action: 'set',
          fields: [
            { field: 'tags', before: null, after: ['Kept'] },
            { field: 'title', before: null, after: 'My title' },
          ],
        },
      ]);
    },
    STARTING_DATABASE_MS,
  );

  it(
    'changes nothing, and keeps no change set, when nothing differs',
    async () => {
      const store = await aStore();
      const edit = { field: 'title' as const, edit: { value: 'My title', catalogue: 'A film' } };

      await store.change(FILM, [edit], ADA, 'set');

      await expect(store.change(FILM, [edit], ADA, 'set')).resolves.toBeNull();
      await expect(store.history('films', 'movie:603')).resolves.toHaveLength(1);
    },
    STARTING_DATABASE_MS,
  );

  it(
    'notes when the catalogue says something new under an edit',
    async () => {
      const store = await aStore();

      await store.change(
        FILM,
        [{ field: 'title', edit: { value: 'My title', catalogue: 'A film' } }],
        ADA,
        'set',
      );
      await store.noteCatalogue('films', [
        { subjectKey: 'movie:603', field: 'title', value: 'A film, renamed' },
      ]);

      const [edit] = await store.editsFor('films', ['movie:603']);

      expect(edit?.catalogue).toBe('A film, renamed');
      expect(edit?.catalogueChangedAt).not.toBeNull();
    },
    STARTING_DATABASE_MS,
  );

  it(
    'plans an undo back to before a change, and refuses once the field has changed again',
    async () => {
      const store = await aStore();
      const first = await store.change(
        FILM,
        [{ field: 'title', edit: { value: 'My title', catalogue: 'A film' } }],
        ADA,
        'set',
      );

      await expect(store.planUndo(first ?? '')).resolves.toEqual({
        kind: 'undoable',
        subject: FILM,
        restore: [{ field: 'title', isEdited: false, value: null }],
      });

      await store.change(
        FILM,
        [{ field: 'title', edit: { value: 'Another', catalogue: 'A film' } }],
        ADA,
        'set',
      );

      await expect(store.planUndo(first ?? '')).resolves.toEqual({ kind: 'changedSince' });
      await expect(store.planUndo('nothing')).resolves.toEqual({ kind: 'missing' });
    },
    STARTING_DATABASE_MS,
  );

  it(
    'removes an edit when a field goes back to the catalogue’s',
    async () => {
      const store = await aStore();

      await store.change(
        FILM,
        [{ field: 'title', edit: { value: 'My title', catalogue: 'A film' } }],
        ADA,
        'set',
      );
      await store.change(FILM, [{ field: 'title', edit: null }], ADA, 'reset');

      await expect(store.editsFor('films', ['movie:603'])).resolves.toEqual([]);
      await expect(store.history('films', 'movie:603')).resolves.toHaveLength(2);
    },
    STARTING_DATABASE_MS,
  );
  it(
    'moves a title’s edits and history to a new key, where an edit kept there already wins',
    async () => {
      const store = await aStore();
      const unmatched = { libraryId: 'films', key: 'file:/films/A.mkv', kind: 'film' as const };

      await store.change(
        unmatched,
        [
          { field: 'title', edit: { value: 'From the file', catalogue: 'A' } },
          { field: 'note', edit: { value: 'Mine', catalogue: null } },
        ],
        ADA,
        'set',
      );
      await store.change(
        FILM,
        [{ field: 'title', edit: { value: 'Already here', catalogue: 'A film' } }],
        ADA,
        'set',
      );

      await expect(
        store.move('films', [{ from: unmatched.key, to: FILM.key, kind: 'film' }]),
      ).resolves.toBe(1);

      const kept = await store.editsFor('films', [FILM.key, unmatched.key]);

      expect(kept.map((edit) => [edit.subjectKey, edit.field, edit.value])).toEqual([
        ['movie:603', 'note', 'Mine'],
        ['movie:603', 'title', 'Already here'],
      ]);
      await expect(store.history('films', FILM.key)).resolves.toHaveLength(2);
      await expect(
        store.move('films', [{ from: unmatched.key, to: FILM.key, kind: 'film' }]),
      ).resolves.toBe(0);
    },
    STARTING_DATABASE_MS,
  );

  it(
    'names every title edits are kept for, and throws a title’s away',
    async () => {
      const store = await aStore();

      await store.change(
        FILM,
        [
          { field: 'title', edit: { value: 'My title', catalogue: 'A film' } },
          { field: 'tags', edit: { value: ['Kept'], catalogue: null } },
        ],
        ADA,
        'set',
      );

      await expect(store.subjects('films')).resolves.toMatchObject([
        { key: 'movie:603', kind: 'film', fields: 2, name: 'My title' },
      ]);
      await expect(store.forget('films', ['movie:603'])).resolves.toBe(2);
      await expect(store.subjects('films')).resolves.toEqual([]);
      await expect(store.history('films', 'movie:603')).resolves.toHaveLength(1);
    },
    STARTING_DATABASE_MS,
  );

  it(
    'adds one title’s part of a change made to many to the change set it was given',
    async () => {
      const store = await aStore();
      const shared = await store.change(
        FILM,
        [{ field: 'tags', edit: { value: ['A'], catalogue: null } }],
        ADA,
        'set',
      );
      const other = { ...FILM, key: 'movie:604' };

      await expect(
        store.change(
          other,
          [{ field: 'tags', edit: { value: ['A'], catalogue: null } }],
          ADA,
          'set',
          shared ?? '',
        ),
      ).resolves.toBe(shared);
      await expect(store.planUndo(shared ?? '', other)).resolves.toMatchObject({
        kind: 'undoable',
        subject: { key: 'movie:604' },
      });
    },
    STARTING_DATABASE_MS,
  );
});
