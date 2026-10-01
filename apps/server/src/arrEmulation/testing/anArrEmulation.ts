import { SEERR_DEFAULTS } from '@ValenceContracts/schemas/SeerrLink';
import type { ArrAsk, ArrEmulation } from '@ValenceServer/arrEmulation/ArrEmulation';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

const SEERR_KEY = '0123456789abcdef0123456789abcdef';

const FILMS_LIBRARY = {
  id: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  name: 'Films',
  path: '/media/Films',
  freeBytes: 1000,
  totalBytes: 4000,
};

const SHOWS_LIBRARY = {
  id: '2c4e6a8b-1d3f-4a5c-9e7b-0d2f4a6c8e1b',
  name: 'Series',
  path: '/media/Series',
  freeBytes: 2000,
  totalBytes: 4000,
};

/**
 * A stand-in's dependencies that answer from what they are given, turned on with a known key, and
 * that keep every ask so a test can read what was asked for.
 *
 * @param change - What is different about this one.
 * @returns The dependencies, and the asks made of them.
 */
const anArrEmulation = (change: Partial<ArrEmulation> = {}) => {
  const asks: ArrAsk[] = [];
  const withdrawn: MediaRequest[] = [];
  const emulation: ArrEmulation = {
    readLink: () =>
      Promise.resolve({ ...SEERR_DEFAULTS, isEnabled: true, apiKey: SEERR_KEY, accountId: 'a1' }),
    isRequestingOn: true,
    profiles: () => Promise.resolve([]),
    libraries: (kind) => Promise.resolve(kind === 'film' ? [FILMS_LIBRARY] : [SHOWS_LIBRARY]),
    requests: () => Promise.resolve([]),
    downloads: () => Promise.resolve([]),
    describe: () => Promise.resolve(null),
    filmsHeld: () => Promise.resolve(new Map()),
    seriesHeld: () => Promise.resolve(new Map()),
    episodesHeld: () => Promise.resolve(new Map()),
    seriesOfTvdbId: () => Promise.resolve(null),
    ask: () => Promise.reject(new Error('Nothing was meant to be asked for.')),
    withdraw: (request) => {
      withdrawn.push(request);

      return Promise.resolve();
    },
    ...change,
  };

  return {
    asks,
    withdrawn,
    emulation: {
      ...emulation,
      ask: (asked: ArrAsk) => {
        asks.push(asked);

        return emulation.ask(asked);
      },
    },
  };
};

export { anArrEmulation, FILMS_LIBRARY, SEERR_KEY, SHOWS_LIBRARY };
