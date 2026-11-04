import type {
  LiveTvStore,
  StoredLiveChannel,
  StoredLiveSource,
} from '@ValenceServer/live/LiveTvStore';

type HeldLiveTvStore = {
  store: LiveTvStore;
  changes: Parameters<LiveTvStore['changeSource']>[1][];
  channels: StoredLiveChannel[][];
};

/**
 * A live TV store holding one source, which notes every change and every new set of channels
 * written to it.
 *
 * @param source - The source it holds.
 * @returns The store, and what was written to it.
 */
const aLiveTvStore = (source: StoredLiveSource): HeldLiveTvStore => {
  const changes: HeldLiveTvStore['changes'] = [];
  const channels: HeldLiveTvStore['channels'] = [];
  const store: LiveTvStore = {
    listSources: () => Promise.resolve([source]),
    readSource: (id) => Promise.resolve(id === source.id ? source : null),
    addSource: () => Promise.resolve(),
    changeSource: (_id, change) => {
      changes.push(change);

      return Promise.resolve();
    },
    removeSource: () => Promise.resolve(true),
    replaceChannels: (_id, next) => {
      channels.push([...next]);

      return Promise.resolve();
    },
    replaceProgrammes: () => Promise.resolve(),
    listChannels: () => Promise.resolve([]),
    noteHealth: () => Promise.resolve(),
    readChannel: () => Promise.resolve(null),
    listProgrammes: () => Promise.resolve([]),
    favouritesOf: () => Promise.resolve(new Set()),
    keep: () => Promise.resolve(),
    drop: () => Promise.resolve(),
  };

  return { store, changes, channels };
};

export { aLiveTvStore };
