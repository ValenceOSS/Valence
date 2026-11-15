import { render, renderHook, userEvent, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { useTrackRows } from './useTrackRows';
import type { ATrackListMissingSong } from './ATrackList.types';

const SOURCE = { kind: 'playlist' as const, id: 'mine', name: 'Mine' };

/**
 * A song the library does not have yet.
 *
 * @param key - What it is known by.
 * @param before - The track it comes before.
 * @returns The song.
 */
const aMissingSong = (key: string, before: number): ATrackListMissingSong => ({
  key,
  before,
  title: `Missing ${key}`,
  artist: 'Mara Quill',
  coverUrl: null,
});

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('useTrackRows', () => {
  it('lays each missing song in its place before the track it comes before', async () => {
    const laid = await renderHook(
      () =>
        useTrackRows({
          tracks: [aTrack(1), aTrack(2)],
          source: SOURCE,
          onAlbum: jest.fn(),
          onArtist: jest.fn(),
          missing: [aMissingSong('first', 0), aMissingSong('second', 1), aMissingSong('last', 9)],
        }),
      { wrapper: CacheScope },
    );
    const rows = laid.result.current;

    expect(rows.count).toBe(5);
    expect(Array.from({ length: rows.count }, (_, at) => rows.keyOf(at))).toEqual([
      'first',
      `${aTrack(1).id}:0`,
      'second',
      `${aTrack(2).id}:1`,
      'last',
    ]);
  });

  it('draws a row that plays the list from its track', async () => {
    const laid = await renderHook(
      () =>
        useTrackRows({
          tracks: [aTrack(1), aTrack(2)],
          source: SOURCE,
          onAlbum: jest.fn(),
          onArtist: jest.fn(),
        }),
      { wrapper: CacheScope },
    );
    const drawn = await render(<>{laid.result.current.draw(1)}</>, { wrapper: CacheScope });

    await userEvent.press(drawn.getByRole('button', { name: 'Play Track 2' }));

    await waitFor(() => {
      expect(thePhonesMusicPlayer().read().current?.id).toBe(aTrack(2).id);
    });
  });
});
