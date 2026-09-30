import { musicQueries } from '@ValenceClient/query/musicQueries';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { sectionsForAnArtist } from '@ValenceMobile/carPlay/sectionsForAnArtist';
import type { QueryClient } from '@tanstack/react-query';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import type { NativeCarPlay } from '@ValenceMobile/carPlay/NativeCarPlay.types';
import { say } from '@ValenceI18n/say';

/**
 * Plays some tracks from the first, and shows the car's Now Playing screen over its lists.
 *
 * @param car - The car.
 * @param tracks - What to play.
 * @param startAt - Which of them to start at.
 * @param options - Where they came from, as the player is told it.
 */
const playInTheCar = (
  car: NativeCarPlay,
  tracks: readonly MusicTrack[],
  startAt: number,
  options: Parameters<ReturnType<typeof thePhonesMusicPlayer>['play']>[2],
) => {
  if (tracks.length === 0) {
    return;
  }

  thePhonesMusicPlayer().play(tracks, startAt, options);
  car.showNowPlaying();
};

/**
 * Does what choosing a row in the car means: plays an album, a playlist, liked songs or one of an
 * artist's popular songs, or opens an artist's own list.
 *
 * @param id - The row chosen, as the shelves named it.
 * @param car - The car.
 * @param cache - Where the phone keeps what it has read, and reads what it has not.
 */
const playFromTheCar = async (id: string, car: NativeCarPlay, cache: QueryClient) => {
  const [kind, first, second] = id.split(':');

  if (kind === 'liked') {
    const tracks = await cache.fetchQuery(musicQueries.liked());

    playInTheCar(car, tracks, 0, {
      source: { kind: 'liked', id: null, name: say('common.likedSongs') },
    });
    return;
  }

  if (first === undefined) {
    return;
  }

  if (kind === 'album') {
    const { album, tracks } = await cache.fetchQuery(musicQueries.album(first));

    playInTheCar(car, tracks, 0, { source: { kind: 'album', id: album.id, name: album.title } });
    return;
  }

  if (kind === 'playlist') {
    const { playlist, entries } = await cache.fetchQuery(musicQueries.playlist(first));
    const tracks = entries.flatMap((entry) =>
      entry.item === null || entry.item.track === null ? [] : [entry.item.track],
    );

    playInTheCar(car, tracks, 0, {
      source: { kind: 'playlist', id: playlist.id, name: playlist.name },
      isOrdered: playlist.isOrdered,
    });
    return;
  }

  const detail = await cache.fetchQuery(musicQueries.artist(first));

  if (kind === 'artist') {
    car.push(detail.artist.name, sectionsForAnArtist(detail));
    return;
  }

  if (kind === 'song') {
    playInTheCar(car, detail.popular, Number(second ?? 0), {
      source: { kind: 'artist', id: detail.artist.id, name: detail.artist.name },
    });
  }
};

export { playFromTheCar };
