import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { readArrBody } from './readArrBody';

const Schema = z.object({ label: z.string() });

const posting = (body: string) => new Request('http://valence/x', { method: 'POST', body });

describe('readArrBody', () => {
  it('reads a body of the shape expected', async () => {
    await expect(readArrBody(posting('{"label":"seerr"}'), Schema)).resolves.toEqual({
      label: 'seerr',
    });
  });

  it('answers nothing for a body of another shape', async () => {
    await expect(readArrBody(posting('{"label":3}'), Schema)).resolves.toBeNull();
  });

  it('answers nothing for a body that is not JSON', async () => {
    await expect(readArrBody(posting('label'), Schema)).resolves.toBeNull();
  });
});
