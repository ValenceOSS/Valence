import { useEffect, useRef } from 'react';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

const WEIGH_AFTER_MS = 250;

/**
 * Asks what the current choice would cost, once the choosing has stopped.
 *
 * The asking is held in a ref rather than named as a dependency, and that is the whole reason this
 * exists. Weighing tells the caller something, a caller that re-renders on being told hands back a
 * fresh function, and a fresh function named as a dependency is a fresh reason to weigh — a loop
 * with a request inside it. Left in, the server was asked continuously, the button flickered
 * between states, and the admin area eventually threw the operator out of the dialog.
 *
 * Waiting a moment first is the other half of it. Ticking a programme of forty episodes changes the
 * choice forty times in as many milliseconds, and every one of those is a question about the whole
 * batch rather than about the episode that moved.
 *
 * @param isOpen - Whether anything is being chosen at all.
 * @param mediaIds - The files chosen.
 * @param settings - What was chosen to do to them.
 * @param onWeigh - What to ask, which may be a different function on every render.
 */
const useWeighing = (
  isOpen: boolean,
  mediaIds: string[],
  settings: ReencodeSettings,
  onWeigh: (mediaIds: string[], settings: ReencodeSettings) => void,
): void => {
  const live = useRef(onWeigh);

  live.current = onWeigh;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timer = setTimeout(() => {
      live.current(mediaIds, settings);
    }, WEIGH_AFTER_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, mediaIds, settings]);
};

export { WEIGH_AFTER_MS, useWeighing };
