import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { theCar } from '@ValenceMobile/carPlay/theCar';
import { shelvesForTheCar } from '@ValenceMobile/carPlay/shelvesForTheCar';
import { playFromTheCar } from '@ValenceMobile/carPlay/playFromTheCar';
import { CarChoiceSchema } from '@ValenceMobile/carPlay/CarChoiceSchema';
import { say } from '@ValenceI18n/say';

const SIGN_IN_FIRST = say('phone.carPlay.useCarPlay.openValenceOnYourIPhoneAnd');

/**
 * Fills CarPlay with whoever is signed in's music, keeps it current as their library changes, and
 * plays what is chosen in the car through the phone's own player, so the lock screen, Control
 * Centre and the car all follow the same song. Once nobody is signed in the car says so.
 */
const useCarPlay = () => {
  const cache = useQueryClient();
  const liked = useQuery(musicQueries.liked());
  const newest = useQuery(musicQueries.albums('recent'));
  const albums = useQuery(musicQueries.albums('title'));
  const playlists = useQuery(musicQueries.playlists());
  const artists = useQuery(musicQueries.artists());

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
      car.signedOut(SIGN_IN_FIRST);
    };
  }, [cache]);

  useEffect(() => {
    const car = theCar();
    const address = platformInUse().serverAddress();

    if (car === null || address === null) {
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
  }, [liked.data, newest.data, albums.data, playlists.data, artists.data]);
};

export { useCarPlay };
