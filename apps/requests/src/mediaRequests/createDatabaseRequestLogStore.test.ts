import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';
import { createDatabaseMediaRequestStore } from './createDatabaseMediaRequestStore';
import { createDatabaseRequestLogStore } from './createDatabaseRequestLogStore';

describe('createDatabaseRequestLogStore', () => {
  it('keeps what a request did, newest first, the last two hundred lines', async () => {
    const db = await aScratchDatabase();
    const log = createDatabaseRequestLogStore(db);
    const { id } = aMediaRequest();

    await createDatabaseMediaRequestStore(db).insert(aMediaRequest());

    for (let line = 1; line <= 202; line += 1) {
      await log.add(id, `Line ${line.toString()}`);
    }

    const kept = await log.list(id);

    expect(kept).toHaveLength(200);
    expect(kept[0]?.message).toBe('Line 202');
    expect(kept.at(-1)?.message).toBe('Line 3');
    expect(await log.list('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toEqual([]);
  });
});
