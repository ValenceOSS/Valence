import { QueryClient } from '@tanstack/react-query';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { aFakeCar } from '@ValenceMobile/testing/aFakeCar';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { anArtist } from '@ValenceMobile/testing/anArtist';
import { aPlaylist } from '@ValenceMobile/testing/aPlaylist';
import { playFromTheCar } from './playFromTheCar';

const ALBUM = '00000000-0000-4000-8000-00000000a1b1';
const ARTIST = '00000000-0000-4000-8000-00000000a7a7';
const PLAYLIST = '00000000-0000-4000-8000-0000000000aa';

/**
 * A cache already holding everything the car can ask for.
 *
 * @returns The cache.
 */
const aFullCache = () => {
  const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

  cache.setQueryData(musicQueries.liked().queryKey, [aTrack(1), aTrack(2)]);
  cache.setQueryData(musicQueries.album(ALBUM).queryKey, { album: anAlbum(), tracks: [aTrack(3)] });
  cache.setQueryData(musicQueries.playlist(PLAYLIST).queryKey, {
    playlist: aPlaylist({ isOrdered: true }),
    entries: [
      {
        id: '00000000-0000-4000-8000-0000000000e1',
        position: 0,
        addedAt: '2026-09-01T00:00:00.000Z',
        missing: null,
        item: {
          id: aTrack(4).id,
          kind: 'song',
          title: 'Track 4',
          subtitle: null,
          durationSeconds: 204,
          track: aTrack(4),
        },
      },
      {
        id: '00000000-0000-4000-8000-0000000000e2',
        position: 1,
        addedAt: '2026-09-01T00:00:00.000Z',
        missing: null,
        item: null,
      },
    ],
  });
  cache.setQueryData(musicQueries.artist(ARTIST).queryKey, {
    artist: anArtist(),
    albums: [anAlbum()],
    appearsOn: [],
    popular: [aTrack(5), aTrack(6)],
  });

  return cache;
};

describe('playFromTheCar', () => {
  it('plays liked songs from the first, and shows Now Playing', async () => {
    const { car } = aFakeCar();

    await playFromTheCar('liked', car, aFullCache());

    expect(thePhonesMusicPlayer().read().current?.id).toBe(aTrack(1).id);
    expect(car.showNowPlaying).toHaveBeenCalledTimes(1);
  });

  it('plays an album', async () => {
    const { car } = aFakeCar();

    await playFromTheCar(`album:${ALBUM}`, car, aFullCache());

    expect(thePhonesMusicPlayer().read().current?.id).toBe(aTrack(3).id);
  });

  it('plays the songs of a playlist, passing over what is no longer there', async () => {
    const { car } = aFakeCar();

    await playFromTheCar(`playlist:${PLAYLIST}`, car, aFullCache());

    expect(
      thePhonesMusicPlayer()
        .read()
        .queue?.tracks.map((track) => track.id),
    ).toEqual([aTrack(4).id]);
  });

  it('opens an artist in a list of their own', async () => {
    const { car } = aFakeCar();

    await playFromTheCar(`artist:${ARTIST}`, car, aFullCache());

    expect(car.push).toHaveBeenCalledWith('Sleep Token', expect.any(Array));
    expect(car.showNowPlaying).not.toHaveBeenCalled();
  });

  it('plays one of an artist’s popular songs, from that song', async () => {
    const { car } = aFakeCar();

    await playFromTheCar(`song:${ARTIST}:1`, car, aFullCache());

    expect(thePhonesMusicPlayer().read().current?.id).toBe(aTrack(6).id);
  });

  it('does nothing with a row it does not know, or with nothing to play', async () => {
    const { car } = aFakeCar();
    const cache = aFullCache();

    cache.setQueryData(musicQueries.liked().queryKey, []);
    await playFromTheCar('album', car, cache);
    await playFromTheCar('liked', car, cache);

    expect(car.showNowPlaying).not.toHaveBeenCalled();
  });
});
