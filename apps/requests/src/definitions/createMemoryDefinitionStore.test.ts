import { describe, expect, it } from 'vitest';
import { createMemoryDefinitionStore } from './createMemoryDefinitionStore';
import type { DefinitionRecord } from './DefinitionRecord';

const RECORD: DefinitionRecord = {
  id: 'alpha',
  name: 'Alpha',
  description: 'A tracker',
  language: 'en-US',
  privacy: 'public',
  protocol: 'torrent',
  categories: ['Movies'],
  yaml: 'id: alpha',
  sha: 'abc',
  fetchedAt: '2026-09-19T00:00:00.000Z',
};

describe('createMemoryDefinitionStore', () => {
  it('keeps definitions, listing them without what they say', async () => {
    const store = createMemoryDefinitionStore();

    await store.save([RECORD]);

    expect(await store.list()).toEqual([
      {
        id: 'alpha',
        name: 'Alpha',
        description: 'A tracker',
        language: 'en-US',
        privacy: 'public',
        protocol: 'torrent',
        categories: ['Movies'],
        sha: 'abc',
      },
    ]);
    expect(await store.get('alpha')).toEqual(RECORD);
    expect(await store.get('beta')).toBeNull();
  });

  it('forgets definitions', async () => {
    const store = createMemoryDefinitionStore([RECORD]);

    await store.remove(['alpha']);

    expect(await store.list()).toEqual([]);
  });

  it('remembers how the catalogue last fared', async () => {
    const store = createMemoryDefinitionStore();

    expect(await store.readState()).toEqual({ updatedAt: null, problem: null });

    await store.writeState({ updatedAt: '2026-09-19T00:00:00.000Z', problem: 'x' });

    expect(await store.readState()).toEqual({
      updatedAt: '2026-09-19T00:00:00.000Z',
      problem: 'x',
    });
  });
});
