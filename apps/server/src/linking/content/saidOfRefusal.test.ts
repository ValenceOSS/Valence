import { describe, expect, it } from 'vitest';
import { saidOfRefusal } from './saidOfRefusal';

describe('saidOfRefusal', () => {
  it('passes on why a linked server refused, in its words', async () => {
    const answered = Response.json(
      {
        error:
          'Your server is already playing as many streams from here as it may. Stop one first.',
        code: 'error.linking.yourServerIsPlayingAsMuchAsItMay',
        values: {},
      },
      { status: 429 },
    );

    expect(await saidOfRefusal(answered)).toEqual({
      code: 'error.linking.yourServerIsPlayingAsMuchAsItMay',
      message:
        'Your server is already playing as many streams from here as it may. Stop one first.',
      values: {},
    });
  });

  it('says the server could not be reached where it gave no reason this one can read', async () => {
    const unreachable = {
      code: 'error.linking.thatServerCouldNotBeReached',
      message: 'That server could not be reached. Check its address can be reached from this one.',
      values: {},
    };

    expect(await saidOfRefusal(null)).toEqual(unreachable);
    expect(await saidOfRefusal(new Response('<html>', { status: 502 }))).toEqual(unreachable);
  });
});
