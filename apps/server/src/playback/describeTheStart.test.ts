import { describe, expect, it } from 'vitest';
import { describeTheStart } from '@ValenceServer/playback/describeTheStart';

describe('describeTheStart', () => {
  it('says where a stream started, how, for whom and why', () => {
    expect(
      describeTheStart({
        startSeconds: 1669,
        mode: 'Transcode',
        client: 'Zen on macOS',
        startedBecause: 'recovering',
      }),
    ).toBe('Playback started at 27:49 (Transcode) for Zen on macOS: recovering from a failure');
  });

  it('leaves out why for a client that does not say', () => {
    expect(
      describeTheStart({
        startSeconds: 0,
        mode: 'DirectPlay',
        client: 'Valence on iPhone',
        startedBecause: undefined,
      }),
    ).toBe('Playback started at 0:00 (DirectPlay) for Valence on iPhone');
  });
});
