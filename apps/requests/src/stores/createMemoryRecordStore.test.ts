import { describe, expect, it } from 'vitest';
import { createMemoryRecordStore } from './createMemoryRecordStore';

const A_RECORD = { id: '0f8fad5b-d9cb-469f-a165-70867728950e', name: 'Jackett', isEnabled: true };

describe('createMemoryRecordStore', () => {
  it('keeps what it is given, and finds it again', async () => {
    const store = createMemoryRecordStore<typeof A_RECORD>();

    await store.insert(A_RECORD);

    expect(await store.list()).toEqual([A_RECORD]);
    expect(await store.find(A_RECORD.id)).toEqual(A_RECORD);
    expect(await store.find('nothing')).toBeNull();
  });

  it('changes only what it is told to', async () => {
    const store = createMemoryRecordStore([A_RECORD]);

    expect(await store.update(A_RECORD.id, { isEnabled: false })).toEqual({
      ...A_RECORD,
      isEnabled: false,
    });
    expect(await store.update('nothing', { isEnabled: false })).toBeNull();
  });

  it('forgets what it is told to, and says whether there was anything', async () => {
    const store = createMemoryRecordStore([A_RECORD]);

    expect(await store.remove(A_RECORD.id)).toBe(true);
    expect(await store.remove(A_RECORD.id)).toBe(false);
  });
});
