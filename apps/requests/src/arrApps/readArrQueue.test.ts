import { describe, expect, it } from 'vitest';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { createArrCaller } from './createArrCaller';
import { readArrQueue } from './readArrQueue';

describe('readArrQueue', () => {
  it('reads the whole queue in one large page', async () => {
    const arr = aFakeArr({
      'GET /api/v3/queue': {
        body: {
          page: 1,
          totalRecords: 1,
          records: [{ id: 5, movieId: 12, title: 'Dune', status: 'queued' }],
        },
      },
    });

    expect(await readArrQueue(createArrCaller(arr.fetch, anArrApp()))).toMatchObject([
      { id: 5, movieId: 12 },
    ]);
    expect(arr.asked[0]?.query.get('pageSize')).toBe('1000');
  });
});
