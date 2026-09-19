import { describe, expect, it } from 'vitest';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';
import { createDatabaseDefinitionStore } from './createDatabaseDefinitionStore';
import type { DefinitionRecord } from './DefinitionRecord';

const RECORD: DefinitionRecord = {
  id: 'alpha',
  name: 'Alpha',
  description: 'A tracker',
  language: 'en-US',
  privacy: 'semi-private',
  protocol: 'torrent',
  categories: ['Movies', 'TV'],
  yaml: 'id: alpha',
  sha: 'abc',
  fetchedAt: '2026-09-19T00:00:00.000Z',
};

describe('createDatabaseDefinitionStore', () => {
  it('keeps a definition, and reads it back as given', async () => {
    const store = createDatabaseDefinitionStore(await aScratchDatabase());

    await store.save([RECORD]);

    expect(await store.get('alpha')).toEqual(RECORD);
    expect(await store.list()).toEqual([
      {
        id: 'alpha',
        name: 'Alpha',
        description: 'A tracker',
        language: 'en-US',
        privacy: 'semi-private',
        protocol: 'torrent',
        categories: ['Movies', 'TV'],
        sha: 'abc',
      },
    ]);
  });

  it('replaces a definition it already has', async () => {
    const store = createDatabaseDefinitionStore(await aScratchDatabase());

    await store.save([RECORD]);
    await store.save([{ ...RECORD, sha: 'def', name: 'Alpha 2' }]);

    expect(await store.get('alpha')).toMatchObject({ sha: 'def', name: 'Alpha 2' });
  });

  it('forgets definitions, and forgets nothing when given nothing', async () => {
    const store = createDatabaseDefinitionStore(await aScratchDatabase());

    await store.save([RECORD]);
    await store.remove([]);

    expect(await store.list()).toHaveLength(1);

    await store.remove(['alpha']);

    expect(await store.get('alpha')).toBeNull();
  });

  it('remembers how the catalogue last fared', async () => {
    const store = createDatabaseDefinitionStore(await aScratchDatabase());

    expect(await store.readState()).toEqual({ updatedAt: null, problem: null });

    await store.writeState({ updatedAt: '2026-09-19T00:00:00.000Z', problem: null });
    await store.writeState({ updatedAt: '2026-09-20T00:00:00.000Z', problem: 'Timed out' });

    expect(await store.readState()).toEqual({
      updatedAt: '2026-09-20T00:00:00.000Z',
      problem: 'Timed out',
    });
  });
});
