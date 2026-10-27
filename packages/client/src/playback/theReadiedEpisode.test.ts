import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aStartedSession } from '@ValenceClient/testing/aStartedSession';
import { forgetTheReadiedEpisode, theReadiedEpisode } from './theReadiedEpisode';

const NEXT = {
  mediaId: 'episode-2',
  startSeconds: 0,
  audioStreamIndex: undefined,
  subtitleStreamIndex: undefined,
  quality: undefined,
};

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetTheReadiedEpisode();
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('theReadiedEpisode', () => {
  it('is the same one wherever it is asked for', () => {
    expect(theReadiedEpisode()).toBe(theReadiedEpisode());
  });

  it('stops the session it held on being forgotten', async () => {
    const fetching = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));

    vi.stubGlobal('fetch', fetching);
    theReadiedEpisode().readyAhead('episode-2', () =>
      Promise.resolve({
        choices: NEXT,
        outcome: { kind: 'started', session: aStartedSession('next') },
      }),
    );
    await new Promise((done) => setTimeout(done, 0));
    forgetTheReadiedEpisode();

    expect(fetching).toHaveBeenCalledWith(
      '/api/playback/session/next?clientId=client-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
