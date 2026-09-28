type KeptLatest<TValue> = {
  now: () => TValue;
  set: (value: TValue) => void;
  whenChanged: (listener: (value: TValue) => void) => () => void;
};

/**
 * Holds the latest of something the main process says, and hands it to whoever asks, however late
 * they ask.
 *
 * A page asked once as it loaded and listened afterwards, and anything said between the two was
 * lost for as long as the window stayed open. The updater starts before the window exists, so an
 * installer already on disk was announced within a second of opening — while the page was still
 * being drawn — and the button it should have put up never came. Kept here instead, from the moment
 * the preload script runs, and given to every listener as it joins, nothing said is missed.
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
