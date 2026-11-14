import { describe, expect, it } from 'vitest';
import { PlaybackPlanSchema } from '@ValenceContracts/schemas/PlaybackPlan';
import { startedSessionOfJellyfin } from './startedSessionOfJellyfin';

const CONTEXT = { address: 'http://j.test', token: 'tok' };

const MEDIA = '0f8fad5b-d9cb-469f-a165-70867728950e';

describe('startedSessionOfJellyfin', () => {
  it('plays the file itself, with the token, where Jellyfin would hand it over', () => {
    const started = startedSessionOfJellyfin(
      { Id: 'src', SupportsDirectPlay: true },
      'play',
      MEDIA,
      'abc',
      CONTEXT,
    );

    expect(started.delivery).toEqual({
      kind: 'direct',
      url: 'http://j.test/Videos/abc/stream?static=true&MediaSourceId=src&PlaySessionId=play&api_key=tok',
    });
    expect(PlaybackPlanSchema.safeParse(started.plan).success).toBe(true);
  });

  it('plays Jellyfin’s converted stream where it would not', () => {
    expect(
      startedSessionOfJellyfin(
        {
          Id: 'src',
          SupportsDirectPlay: false,
          TranscodingUrl: '/videos/abc/master.m3u8?api_key=tok',
        },
        'play',
        MEDIA,
        'abc',
        CONTEXT,
      ),
    ).toMatchObject({
      mode: 'Transcode',
      delivery: { kind: 'hls', manifestUrl: 'http://j.test/videos/abc/master.m3u8?api_key=tok' },
    });
  });
});
