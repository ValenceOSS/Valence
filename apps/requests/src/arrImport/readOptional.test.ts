import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { readOptional } from './readOptional';

const LIST = z.array(z.number());

describe('readOptional', () => {
  it('reads what the app has', async () => {
    const arr = aFakeArr({ 'GET /api/v3/customformat': { body: [1, 2] } });

    expect(
      await readOptional(createArrCaller(arr.fetch, anArrApp()), '/customformat', LIST, []),
    ).toEqual([1, 2]);
  });

  it('takes an app without the thing to have none of it', async () => {
    const arr = aFakeArr({});

    expect(
      await readOptional(createArrCaller(arr.fetch, anArrApp()), '/customformat', LIST, []),
    ).toEqual([]);
  });

  it('still fails where the app fails for another reason', async () => {
    const arr = aFakeArr({ 'GET /api/v3/customformat': { status: 500, body: null } });

    await expect(
      readOptional(createArrCaller(arr.fetch, anArrApp()), '/customformat', LIST, []),
    ).rejects.toThrow('Radarr answered with HTTP 500');
  });
});
