import { describe, expect, it } from 'vitest';
import { readRefusal } from './readRefusal';

describe('readRefusal', () => {
  it('says nothing was refused when the server agreed', async () => {
    expect(await readRefusal(new Response('{}', { status: 200 }))).toBeNull();
  });

  it('carries the server’s own words, it being the side that knows', async () => {
    const response = new Response(JSON.stringify({ error: 'That name is taken.' }), {
      status: 409,
    });

    expect(await readRefusal(response)).toStrictEqual({ message: 'That name is taken.' });
  });

  it('carries the server’s code for the refusal, so a form can tell one from another', async () => {
    const response = Response.json(
      { error: 'That setup code doesn’t match.', code: 'error.setup.thatSetupCodeIsNotRight' },
      { status: 403 },
    );

    expect(await readRefusal(response)).toEqual({
      message: 'That setup code doesn’t match.',
      code: 'error.setup.thatSetupCodeIsNotRight',
    });
  });

  it('says something rather than nothing when a refusal explains itself badly', async () => {
    const response = new Response('<html>no</html>', { status: 500 });

    expect(await readRefusal(response)).toStrictEqual({
      message: 'Couldn’t do that. Try again in a moment.',
    });
  });
});
