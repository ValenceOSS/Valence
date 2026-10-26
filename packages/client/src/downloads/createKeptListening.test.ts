import { describe, expect, it, vi } from 'vitest';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aKeptListening } from '@ValenceClient/testing/aKeptListening';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aTrack } from '@ValenceClient/testing/aTrack';
import type { FakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';
import type { KeptListeningFile } from '@ValenceContracts/schemas/KeptListening';
import { createKeptListening } from './createKeptListening';
import type { KeptListeningNeeds, KeptListeningShelfKeeper } from './createKeptListening';

const ALBUM = aKeptListening();

const ART = `artwork-album-${ALBUM.id}.jpg`;

const ONE = `track-${aTrack(1).id}-lossless.flac`;

const TWO = `track-${aTrack(2).id}-lossless.flac`;

const THREE = `track-${aTrack(3).id}-lossless.flac`;

const A_PLAYLIST = aKeptListening({
  kind: 'playlist',
  id: '00000000-0000-4000-8000-0000000000b1',
  title: 'Late',
  artworkFrom: null,
  tracks: [aTrack(2), aTrack(3)],
});

type Kept = {
  keeper: KeptListeningShelfKeeper;
  files: FakeListeningFiles;
  store: DeviceStore;
  clock: { now: number };
};

/**
 * Something keeping music over a pretend device, whose fetches the test finishes by hand.
 *
 * @param overrides - Anything the device should answer differently.
 * @returns What keeps it, the pretend files, where the list is written, and a clock to move.
 */
const aKeeper = (overrides: Partial<KeptListeningNeeds> = {}): Kept => {
  const files = aFakeListeningFiles();
  const store = aFakePlatform().store;
  const clock = { now: 10_000 };
  const keeper = createKeptListening({
    store,
    files: files.files,
    server: () => null,
    now: () => clock.now,
    ...overrides,
  });

  return { keeper, files, store, clock };
};

/**
 * Lets every fetch that has been answered carry on to the next.
 *
 * @returns Once it has.
 */
const settle = async (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/**
 * The file on the shelf with a name.
 *
 * @param keeper - What keeps it.
 * @param name - The file.
 * @returns The file, or nothing.
 */
const fileNamed = (keeper: KeptListeningShelfKeeper, name: string): KeptListeningFile | undefined =>
  keeper.shelf().files.find((file) => file.name === name);

describe('createKeptListening', () => {
  it('starts with nothing kept', () => {
    expect(aKeeper().keeper.shelf()).toEqual({ kept: [], files: [] });
  });

  it('lists every file to fetch, and fetches only the first', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);

    expect(keeper.shelf().kept).toEqual([ALBUM]);
    expect(keeper.shelf().files.map((file) => [file.name, file.state])).toEqual([
      [ART, 'fetching'],
      [ONE, 'fetching'],
      [TWO, 'fetching'],
    ]);
    expect(files.asked).toEqual([ART]);
  });

  it('fetches one file at a time, each once the last has arrived', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    files.finish(ART, 2048);
    await settle();

    expect(fileNamed(keeper, ART)).toMatchObject({ state: 'here', bytes: 2048, ofBytes: 2048 });
    expect(files.asked).toEqual([ART, ONE]);
    expect(files.isFetching(TWO)).toBe(false);
  });

  it('has everything once every file has arrived, and asks for nothing more', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);

    for (const name of [ART, ONE, TWO]) {
      files.finish(name);
      await settle();
    }

    expect(keeper.shelf().files.every((file) => file.state === 'here')).toBe(true);
    expect(files.asked).toEqual([ART, ONE, TWO]);
  });

  it('says why a file could not be fetched, and carries on with the next', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    files.fail(ART, 'There is no room left');
    await settle();

    expect(fileNamed(keeper, ART)).toMatchObject({
      state: 'failed',
      bytes: 10,
      failure: 'There is no room left',
    });
    expect(files.asked).toEqual([ART, ONE]);
  });

  it('says the download failed where the device could not even say why', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    files.breakOff(ART);
    await settle();

    expect(fileNamed(keeper, ART)).toMatchObject({ state: 'failed', failure: 'Download failed' });
  });

  it('pauses a file the device stopped of its own accord, without calling it a failure', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    await files.files.stop(ART);
    await settle();

    expect(fileNamed(keeper, ART)).toMatchObject({ state: 'paused', bytes: 40, failure: null });
  });

  it('follows a file as it arrives, telling whoever listens at most once a second', async () => {
    const { keeper, files, clock } = aKeeper();
    const listener = vi.fn();

    await keeper.keep(ALBUM);
    keeper.whenChanged(listener);
    files.report(ART, 30, 200);

    expect(fileNamed(keeper, ART)).toMatchObject({ bytes: 30, ofBytes: 200 });
    expect(listener).not.toHaveBeenCalled();

    clock.now += 1000;
    files.report(ART, 60, null);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(fileNamed(keeper, ART)).toMatchObject({ bytes: 60, ofBytes: 200 });
  });

  it('keeps one copy of a song an album and a playlist both hold', async () => {
    const { keeper } = aKeeper();

    await keeper.keep(ALBUM);
    await keeper.keep(A_PLAYLIST);

    expect(keeper.shelf().files.filter((file) => file.name === TWO)).toHaveLength(1);
    expect(keeper.shelf().kept.map((kept) => kept.kind)).toEqual(['playlist', 'album']);
  });

  it('keeps a song another kept thing holds as the first is dropped, and lets go of the rest', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    await keeper.keep(A_PLAYLIST);
    await keeper.drop('album', ALBUM.id);

    expect(keeper.shelf().files.map((file) => file.name)).toEqual([TWO, THREE]);
    expect(files.stopped).toEqual([ART]);
    expect(files.dropped).toEqual([ART, ONE]);

    await keeper.drop('playlist', A_PLAYLIST.id);

    expect(keeper.shelf()).toEqual({ kept: [], files: [] });
    expect(files.dropped).toEqual([ART, ONE, TWO, THREE]);
  });

  it('keeps the newest of the same thing kept twice, and fetches nothing already here', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);

    for (const name of [ART, ONE, TWO]) {
      files.finish(name);
      await settle();
    }

    await keeper.keep({ ...ALBUM, title: 'Even In Arcadia (Deluxe)' });

    expect(keeper.shelf().kept.map((kept) => kept.title)).toEqual(['Even In Arcadia (Deluxe)']);
    expect(keeper.shelf().files.every((file) => file.state === 'here')).toBe(true);
    expect(files.asked).toEqual([ART, ONE, TWO]);
  });

  it('tries a failed file again as the same thing is kept again', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    files.fail(ART, 'There is no room left');
    await settle();
    files.finish(ONE);
    await settle();
    files.finish(TWO);
    await settle();
    await keeper.keep(ALBUM);

    expect(fileNamed(keeper, ART)).toMatchObject({ state: 'fetching', failure: null });
    expect(files.asked).toEqual([ART, ONE, TWO, ART]);
  });

  it('lets go of a song a kept thing no longer holds as it is kept again', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    await keeper.keep({ ...ALBUM, tracks: [aTrack(1)] });

    expect(fileNamed(keeper, TWO)).toBeUndefined();
    expect(files.dropped).toEqual([TWO]);
  });

  it('starts no second fetch while one is under way', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    await keeper.keep(A_PLAYLIST);
    keeper.carryOn();

    expect(files.asked).toEqual([ART]);
  });

  it('pauses what has not arrived, stopping the file on its way', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    await keeper.pause('album', ALBUM.id, true);
    await settle();

    expect(keeper.shelf().files.map((file) => file.state)).toEqual(['paused', 'paused', 'paused']);
    expect(files.stopped).toEqual([ART]);
    expect(files.asked).toEqual([ART]);
  });

  it('carries on from where it was paused', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    await keeper.pause('album', ALBUM.id, true);
    await settle();
    await keeper.pause('album', ALBUM.id, false);

    expect(keeper.shelf().files.map((file) => file.state)).toEqual([
      'fetching',
      'fetching',
      'fetching',
    ]);
    expect(files.asked).toEqual([ART, ART]);
  });

  it('leaves what has arrived alone as it pauses', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    files.finish(ART);
    await settle();
    await keeper.pause('album', ALBUM.id, true);

    expect(fileNamed(keeper, ART)?.state).toBe('here');
    expect(fileNamed(keeper, ONE)?.state).toBe('paused');
  });

  it('pauses nothing it does not keep', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    await keeper.pause('playlist', A_PLAYLIST.id, true);

    expect(fileNamed(keeper, ART)?.state).toBe('fetching');
    expect(files.stopped).toEqual([]);
  });

  it('plays a song from the device only once it has arrived', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    files.finish(ART);
    await settle();

    expect(keeper.trackAddress(aTrack(1).id)).toBeNull();

    files.finish(ONE);
    await settle();

    expect(keeper.trackAddress(aTrack(1).id)).toBe(`file:///kept/${ONE}`);
    expect(keeper.artworkAddress('album', ALBUM.id)).toBe(`file:///kept/${ART}`);
    expect(keeper.artworkAddress('playlist', A_PLAYLIST.id)).toBeNull();
  });

  it('plays an audiobook track from the device once it has arrived', async () => {
    const { book, chapters } = anAudiobook();
    const chapter = chapters[0];
    const { keeper, files } = aKeeper();

    await keeper.keep(
      aKeptListening({
        kind: 'audiobook',
        id: book.id,
        artworkFrom: null,
        tracks: [],
        book,
        chapters,
      }),
    );

    expect(keeper.chapterAddress(chapter?.id ?? '')).toBeNull();

    files.finish(`chapter-${chapter?.id ?? ''}.m4b`);
    await settle();

    expect(keeper.chapterAddress(chapter?.id ?? '')).toBe(
      `file:///kept/chapter-${chapter?.id ?? ''}.m4b`,
    );
  });

  it('tells whoever listens of each change until they stop listening', async () => {
    const { keeper } = aKeeper();
    const listener = vi.fn();
    const stop = keeper.whenChanged(listener);

    await keeper.keep(ALBUM);

    expect(listener).toHaveBeenLastCalledWith(keeper.shelf());

    const told = listener.mock.calls.length;

    stop();
    await keeper.drop('album', ALBUM.id);

    expect(listener).toHaveBeenCalledTimes(told);
  });

  it('writes the list down, and reads it back after the app closes', async () => {
    const first = aKeeper();

    await first.keeper.keep(ALBUM);
    first.files.finish(ART);
    await settle();

    expect(first.store.read('valence.kept.listening')).toBe(JSON.stringify(first.keeper.shelf()));

    const files = aFakeListeningFiles();
    const again = createKeptListening({
      store: first.store,
      files: files.files,
      server: () => null,
      now: () => 0,
    });

    expect(again.shelf()).toEqual(first.keeper.shelf());

    again.carryOn();

    expect(files.asked).toEqual([ONE]);
  });

  it('starts from nothing where what was written cannot be read', () => {
    const store = aFakePlatform().store;

    store.write('valence.kept.listening', JSON.stringify({ kept: 'everything' }));

    const keeper = createKeptListening({
      store,
      files: aFakeListeningFiles().files,
      server: () => null,
      now: () => 0,
    });

    expect(keeper.shelf()).toEqual({ kept: [], files: [] });
  });

  it('starts from nothing where what was written is not even a list', () => {
    const store = aFakePlatform().store;

    store.write('valence.kept.listening', '{not json');

    const keeper = createKeptListening({
      store,
      files: aFakeListeningFiles().files,
      server: () => null,
      now: () => 0,
    });

    expect(keeper.shelf()).toEqual({ kept: [], files: [] });
  });

  it('keeps fetching a song another kept thing still downloading holds as the first is paused', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    await keeper.keep(A_PLAYLIST);
    await keeper.pause('album', ALBUM.id, true);
    await settle();

    expect(keeper.shelf().files.map((file) => [file.name, file.state])).toEqual([
      [ART, 'paused'],
      [ONE, 'paused'],
      [TWO, 'fetching'],
      [THREE, 'fetching'],
    ]);
    expect(files.stopped).toEqual([ART]);
    expect(files.asked).toEqual([ART, TWO]);
  });

  it('pauses a shared song once everything holding it is paused, stopping it on its way', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    files.finish(ART);
    await settle();
    files.finish(ONE);
    await settle();
    await keeper.keep(A_PLAYLIST);
    await keeper.pause('album', ALBUM.id, true);

    expect(fileNamed(keeper, TWO)?.state).toBe('fetching');

    await keeper.pause('playlist', A_PLAYLIST.id, true);
    await settle();

    expect(keeper.shelf().files.map((file) => [file.name, file.state])).toEqual([
      [ART, 'here'],
      [ONE, 'here'],
      [TWO, 'paused'],
      [THREE, 'paused'],
    ]);
    expect(files.stopped).toEqual([TWO]);
    expect(files.asked).toEqual([ART, ONE, TWO]);
  });

  it('pauses a shared song with the first to hold it where the other has nothing of its own on its way', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    await keeper.keep({ ...A_PLAYLIST, tracks: [aTrack(2)] });
    await keeper.pause('album', ALBUM.id, true);
    await settle();

    expect(keeper.shelf().files.map((file) => file.state)).toEqual(['paused', 'paused', 'paused']);
    expect(files.asked).toEqual([ART]);
  });

  it('does not stop a shared song on its way as the first to hold it is paused', async () => {
    const { keeper, files } = aKeeper();

    await keeper.keep(ALBUM);
    files.finish(ART);
    await settle();
    files.finish(ONE);
    await settle();
    await keeper.keep(A_PLAYLIST);
    await keeper.pause('album', ALBUM.id, true);

    expect(files.isFetching(TWO)).toBe(true);
    expect(files.stopped).toEqual([]);
    expect(fileNamed(keeper, TWO)?.state).toBe('fetching');
  });

  it('carries on with every file of the thing paused, shared or not, as it is resumed', async () => {
    const store = aFakePlatform().store;
    const paused = (name: string) => ({ name, from: '/api/music', state: 'paused' });

    store.write(
      'valence.kept.listening',
      JSON.stringify({ kept: [A_PLAYLIST, ALBUM], files: [ART, ONE, TWO].map(paused) }),
    );

    const files = aFakeListeningFiles();
    const keeper = createKeptListening({
      store,
      files: files.files,
      server: () => null,
      now: () => 0,
    });

    await keeper.pause('album', ALBUM.id, false);

    expect(keeper.shelf().files.map((file) => file.state)).toEqual([
      'fetching',
      'fetching',
      'fetching',
    ]);
    expect(files.asked).toEqual([ART]);
  });

  it('fetches nothing kept from another server while this one is in use', async () => {
    const { keeper, files } = aKeeper({ server: () => 'https://valence.example' });

    await keeper.keep({ ...ALBUM, server: 'https://elsewhere.example' });

    expect(fileNamed(keeper, ART)?.state).toBe('fetching');
    expect(files.asked).toEqual([]);
  });

  it('fetches what was kept from this server', async () => {
    const { keeper, files } = aKeeper({ server: () => 'https://valence.example' });

    await keeper.keep({ ...ALBUM, server: 'https://valence.example' });

    expect(files.asked).toEqual([ART]);
  });
});
