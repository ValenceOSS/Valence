import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { theCar } from '@ValenceMobile/carPlay/theCar';
import { theKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { useKeptListening } from '@ValenceClient/downloads/useKeptListening';
import { shelvesForTheCar } from '@ValenceMobile/carPlay/shelvesForTheCar';
import { playFromTheCar } from '@ValenceMobile/carPlay/playFromTheCar';
import { CarChoiceSchema } from '@ValenceMobile/carPlay/CarChoiceSchema';
import { say } from '@ValenceI18n/say';

const SIGN_IN_FIRST = say('phone.carPlay.useCarPlay.openValenceOnYourIPhoneAnd');

const NO_MUSIC = say('phone.carPlay.useCarPlay.thisServerHasNoMusicLibrary');

const CarConnectionSchema = z.object({ isConnected: z.boolean() });

/**
 * Fills CarPlay with whoever is signed in's music, keeps it current as their library changes, and
 * plays what is chosen in the car through the phone's own player, so the lock screen, Control
 * Centre and the car all follow the same song. Once nobody is signed in, or the server has no music
 * library, the car says so. Nothing is asked of the server until the session has answered, since
 * every one of these questions depends on who is asking, and until a car is connected, since the
 * whole music catalogue is too much to fetch at every sign-in for a car that may never come. A phone
 * without CarPlay, an Android one, never asks at all.
 */
const useCarPlay = () => {
  const cache = useQueryClient();
  const session = useQuery(sessionQueries.who());
  const [isInACar, setIsInACar] = useState(() => theCar()?.isConnected() ?? false);
  const isWanted = Boolean(session.data) && isInACar;
  const liked = useQuery({ ...musicQueries.liked(), enabled: isWanted });
  const newest = useQuery({ ...musicQueries.albums('recent'), enabled: isWanted });
  const albums = useQuery({ ...musicQueries.albums('title'), enabled: isWanted });
  const playlists = useQuery({ ...musicQueries.playlists(), enabled: isWanted });
  const artists = useQuery({ ...musicQueries.artists(), enabled: isWanted });
  const libraries = useQuery({ ...libraryQueries.all(), enabled: isWanted });
  const hasMusic = libraries.data?.some((library) => library.kind === 'music') ?? null;
  const kept = useKeptListening().here;

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
    const connecting = car.addListener('onCar', (said) => {
      const told = CarConnectionSchema.safeParse(said);

      if (told.success) {
        setIsInACar(told.data.isConnected);
      }
    });

    setIsInACar(car.isConnected());

    return () => {
      choosing.remove();
      connecting.remove();
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
      kept,
      keptArtwork: (one) => theKeptListening().artworkAddress(one.kind, one.id),
    });

    void theCookiesThisPhoneHolds(address).then((cookie) => {
      car.setShelves(shelves, cookie);
    });
  }, [hasMusic, liked.data, newest.data, albums.data, playlists.data, artists.data, kept]);
};

export { useCarPlay };
