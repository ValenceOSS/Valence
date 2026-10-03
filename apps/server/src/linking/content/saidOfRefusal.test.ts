import { describe, expect, it } from 'vitest';
import { saidOfRefusal } from './saidOfRefusal';

describe('saidOfRefusal', () => {
  it('passes on why a linked server refused, in its words', async () => {
    const answered = Response.json(
      {
        error: 'Your server has reached its stream limit on this server. Stop a stream first.',
        code: 'error.linking.yourServerIsPlayingAsMuchAsItMay',
        values: {},
      },
      { status: 429 },
    );

    expect(await saidOfRefusal(answered)).toEqual({
      code: 'error.linking.yourServerIsPlayingAsMuchAsItMay',
      message: 'Your server has reached its stream limit on this server. Stop a stream first.',
      values: {},
    });
  });

  it('says the server could not be reached where it gave no reason this one can read', async () => {
    const unreachable = {
      code: 'error.linking.thatServerCouldNotBeReached',
      message: 'Couldn’t connect to that server. Check its address is reachable from this one.',
      values: {},
    };

    expect(await saidOfRefusal(null)).toEqual(unreachable);
    expect(await saidOfRefusal(new Response('<html>', { status: 502 }))).toEqual(unreachable);
  });
});
