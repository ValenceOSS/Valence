import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { readBody } from './readBody';

const Shape = z.object({ name: z.string() });

/**
 * A request carrying the body given.
 */
const carrying = (body: string) => new Request('http://requests/api', { method: 'POST', body });

describe('readBody', () => {
  it('reads a body in the shape asked for', async () => {
    expect(await readBody(carrying('{"name":"Jackett"}'), Shape)).toEqual({ name: 'Jackett' });
  });

  it('reads nothing from a body in another shape', async () => {
    expect(await readBody(carrying('{"title":"Jackett"}'), Shape)).toBeNull();
  });

  it('reads nothing from a body that is not JSON', async () => {
    expect(await readBody(carrying('name=Jackett'), Shape)).toBeNull();
  });
});
