import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { theTvsMusicAudio } from '@ValenceTv/music/theTvsMusicAudio';
import { installTvPlatform } from '@ValenceTv/platform/installTvPlatform';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('installTvPlatform', () => {
  it('tells the application it is on a television that keeps no files', () => {
    installTvPlatform();

    const platform = platformInUse();

    expect(platform.thisClientKind()).toBe('tv');
    expect(platform.describeThisClient()).toBe('Living Room');
    expect(platform.canKeepFiles()).toBe(false);
    expect(platform.buildInfo()).toBeNull();
    expect(platform.musicAudio).toBe(theTvsMusicAudio);
    expect(platform.thisClientId()).toBe(platform.thisClientId());
  });

  it('aims fetch at the server before anything else', () => {
    installTvPlatform();

    expect(globalThis.fetch).not.toBe(realFetch);
  });
});
