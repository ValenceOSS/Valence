type KeptLatest<TValue> = {
  now: () => TValue;
  set: (value: TValue) => void;
  whenChanged: (listener: (value: TValue) => void) => () => void;
};

/**
 * Holds the latest of something the host says and hands it to every listener as it joins, so nothing said before a page listened is missed.
 *
 * @param first - What is known before anything has been said.
 * @returns The latest, the way to replace it, and the way to follow it.
 */
const keepTheLatest = <TValue>(first: TValue): KeptLatest<TValue> => {
  let latest = first;
  const listeners = new Set<(value: TValue) => void>();

  return {
    now: () => latest,
    set: (value) => {
      latest = value;

      for (const listener of listeners) {
        listener(value);
      }
    },
    whenChanged: (listener) => {
      listeners.add(listener);
      listener(latest);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export type { KeptLatest };

export { keepTheLatest };
