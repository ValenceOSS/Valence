import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { theCar } from '@ValenceMobile/carPlay/theCar';
import { shelvesForTheCar } from '@ValenceMobile/carPlay/shelvesForTheCar';
import { playFromTheCar } from '@ValenceMobile/carPlay/playFromTheCar';
import { CarChoiceSchema } from '@ValenceMobile/carPlay/CarChoiceSchema';
import { say } from '@ValenceI18n/say';

const SIGN_IN_FIRST = say('phone.carPlay.useCarPlay.openValenceOnYourIPhoneAnd');

const NO_MUSIC = say('phone.carPlay.useCarPlay.thisServerHasNoMusicLibrary');

/**
 * Fills CarPlay with whoever is signed in's music, keeps it current as their library changes, and
 * plays what is chosen in the car through the phone's own player, so the lock screen, Control
 * Centre and the car all follow the same song. Once nobody is signed in, or the server has no music
 * library, the car says so. Nothing is asked of the server until the session has answered, since
 * every one of these questions depends on who is asking.
 */
const useCarPlay = () => {
  const cache = useQueryClient();
  const session = useQuery(sessionQueries.who());
  const isSignedIn = Boolean(session.data);
  const liked = useQuery({ ...musicQueries.liked(), enabled: isSignedIn });
  const newest = useQuery({ ...musicQueries.albums('recent'), enabled: isSignedIn });
  const albums = useQuery({ ...musicQueries.albums('title'), enabled: isSignedIn });
  const playlists = useQuery({ ...musicQueries.playlists(), enabled: isSignedIn });
  const artists = useQuery({ ...musicQueries.artists(), enabled: isSignedIn });
  const libraries = useQuery({ ...libraryQueries.all(), enabled: isSignedIn });
  const hasMusic = libraries.data?.some((library) => library.kind === 'music') ?? null;

  useEffect(() => {
    const car = theCar();

    if (car === null) {
      return;
    }

    const choosing = car.addListener('onChoose', (said) => {
      const choice = CarChoiceSchema.safeParse(said);

      if (choice.success) {
        void playFromTheCar(choice.data.id, car, cache).catch(() => undefined);
      }
    });

    return () => {
      choosing.remove();
      car.showMessage(SIGN_IN_FIRST);
    };
  }, [cache]);

  useEffect(() => {
    const car = theCar();
    const address = platformInUse().serverAddress();

    if (car === null || address === null) {
      return;
    }

    if (hasMusic === false) {
      car.showMessage(NO_MUSIC);

      return;
    }

    const shelves = shelvesForTheCar({
      liked: liked.data ?? [],
      newest: newest.data ?? [],
      albums: albums.data ?? [],
      playlists: playlists.data ?? [],
      artists: artists.data ?? [],
    });

    void theCookiesThisPhoneHolds(address).then((cookie) => {
      car.setShelves(shelves, cookie);
    });
  }, [hasMusic, liked.data, newest.data, albums.data, playlists.data, artists.data]);
};

export { useCarPlay };
