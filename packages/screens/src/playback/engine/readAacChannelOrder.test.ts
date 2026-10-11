import { describe, expect, it } from 'vitest';
import { readAacChannelOrder } from '@ValenceScreens/playback/engine/readAacChannelOrder';

describe('readAacChannelOrder', () => {
  it('cannot tell the order in a browser without WebCodecs, so nothing is risked', async () => {
    expect(await readAacChannelOrder()).toBeNull();
  });
});
