import { describe, expect, it, vi } from 'vitest';
import { measureWaitingLoudness } from './measureWaitingLoudness';
import type { LoudnessStore } from './measureWaitingLoudness';

const NOW = new Date('2026-10-27T12:00:00Z');

const aStore = (overrides: Partial<LoudnessStore> = {}): LoudnessStore => ({
  waiting: vi.fn(() =>
    Promise.resolve([
      { id: 'loud', path: '/music/loud.flac' },
      { id: 'silent', path: '/music/silent.flac' },
    ]),
  ),
  keepMeasured: vi.fn(() => Promise.resolve()),
  albumsToLevel: vi.fn(() => Promise.resolve([])),
  keepAlbum: vi.fn(() => Promise.resolve()),
  ...overrides,
});

const measuring = (store: LoudnessStore, isCancelled = () => false) => ({
  store,
  measure: (path: string) =>
    Promise.resolve(path.includes('silent') ? null : { integratedLufs: -12, truePeak: 0.97 }),
  onProgress: vi.fn(),
  isCancelled,
  now: () => NOW,
});

describe('measureWaitingLoudness', () => {
  it('keeps the gain that brings each song to the reference loudness', async () => {
    const store = aStore();

    await measureWaitingLoudness(measuring(store));

    expect(store.keepMeasured).toHaveBeenCalledWith(
      'loud',
      { trackGainDb: -6, trackPeak: 0.97 },
      NOW,
    );
  });

  it('marks a song with nothing to hear as tried, so it is not tried again', async () => {
    const store = aStore();
    const outcome = await measureWaitingLoudness(measuring(store));

    expect(store.keepMeasured).toHaveBeenCalledWith('silent', null, NOW);
    expect(outcome).toMatchObject({ measured: 1, unheard: 1 });
  });

  it('counts a song the media service could not read as tried', async () => {
    const store = aStore();
    const outcome = await measureWaitingLoudness({
      ...measuring(store),
      measure: () => Promise.reject(new Error('broken')),
    });

    expect(outcome).toMatchObject({ measured: 0, unheard: 2 });
  });

  it('says how far through it is', async () => {
    const run = measuring(aStore());

    await measureWaitingLoudness(run);

    expect(run.onProgress).toHaveBeenLastCalledWith(2, 2);
  });

  it('levels every album whose songs are all measured', async () => {
    const store = aStore({
      albumsToLevel: vi.fn(() =>
        Promise.resolve([
          {
            albumId: 'album',
            tracks: [
              { durationSeconds: 200, trackGainDb: -6, trackPeak: 0.9 },
              { durationSeconds: 200, trackGainDb: -6, trackPeak: 1 },
            ],
          },
        ]),
      ),
    });
    const outcome = await measureWaitingLoudness(measuring(store));

    expect(store.keepAlbum).toHaveBeenCalledWith('album', expect.closeTo(-6, 6), 1);
    expect(outcome.albums).toBe(1);
  });

  it('stops measuring and leaves albums alone once cancelled', async () => {
    const store = aStore();
    const outcome = await measureWaitingLoudness(measuring(store, () => true));

    expect(store.keepMeasured).not.toHaveBeenCalled();
    expect(store.albumsToLevel).not.toHaveBeenCalled();
    expect(outcome).toEqual({ measured: 0, unheard: 0, albums: 0 });
  });

  it('holds a gain to what any real recording could need', async () => {
    const store = aStore({
      waiting: vi.fn(() => Promise.resolve([{ id: 'whisper', path: '/music/whisper.flac' }])),
    });

    await measureWaitingLoudness({
      ...measuring(store),
      measure: () => Promise.resolve({ integratedLufs: -69, truePeak: 0.01 }),
    });

    expect(store.keepMeasured).toHaveBeenCalledWith(
      'whisper',
      { trackGainDb: 51, trackPeak: 0.01 },
      NOW,
    );
  });
});
