/* oxlint-disable valence/no-hard-coded-strings -- the app's name as a Jellyfin server lists the apps signed in to it */
import { createJellyfinAnswers } from '@ValenceClient/jellyfin/createJellyfinAnswers';
import { createJellyfinIdBook } from '@ValenceClient/jellyfin/createJellyfinIdBook';
import { jellyfinLinks } from '@ValenceClient/jellyfin/jellyfinLinks';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { thisDevicesId } from '@ValenceClient/platform/thisDevicesId';
import type { JellyfinAnswers } from '@ValenceClient/jellyfin/createJellyfinAnswers';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

const APP = 'Valence';

let made: {
  store: DeviceStore;
  answers: JellyfinAnswers;
  links: ReturnType<typeof jellyfinLinks>;
} | null = null;

/**
 * This app's way of answering Valence's endpoints from a Jellyfin server, made once for the
 * device's store and the fetch the app had before it pointed fetch at a server, so asking Jellyfin
 * never comes back through here.
 *
 * @param send - The fetch to reach a Jellyfin server with.
 * @returns The answers and the links they read.
 */
const theJellyfinAnswers = (send: (input: string, init?: RequestInit) => Promise<Response>) => {
  const { store } = platformInUse();

  if (made?.store === store) {
    return made;
  }

  const links = jellyfinLinks(store);

  made = {
    store,
    links,
    answers: createJellyfinAnswers({
      links,
      book: createJellyfinIdBook(store),
      send,
      device: () => {
        const platform = platformInUse();
        const hints = platform.describeThisDevice();

        return {
          app: APP,
          device: hints.name ?? hints.model ?? platform.describeThisClient(),
          deviceId: thisDevicesId(),
          version: platform.buildInfo()?.version ?? '0',
        };
      },
    }),
  };

  return made;
};

export { theJellyfinAnswers };
