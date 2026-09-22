const ON_THE_WAY_DOWN = ['SIGTERM', 'SIGINT'] as const;

const GOODBYE_WITHIN_MS = 1000;

type ExitSignal = (typeof ON_THE_WAY_DOWN)[number];

type Leaving = {
  pid: number;
  once: (signal: ExitSignal, listener: () => void) => void;
  kill: (pid: number, signal: ExitSignal) => void;
};

/**
 * Says goodbye on the network before the server stops, and then stops exactly as it would have.
 *
 * Listening for a signal at all takes over what the signal does, so the signal is raised again once
 * the goodbye is said, with nothing left listening for it — the process ends the way it was always
 * going to, to whatever sent the signal. A goodbye that never finishes is not waited on for long:
 * somebody stopping a server wants it stopped, and a client that missed the goodbye learns the same
 * thing a little later when the last announcement runs out.
 *
 * @param stop - How to stop announcing, told once it has.
 * @param leaving - The process, which a test replaces.
 */
const stopAnnouncingOnExit = (
  stop: (done: () => void) => void,
  leaving: Leaving = process,
): void => {
  for (const signal of ON_THE_WAY_DOWN) {
    leaving.once(signal, () => {
      let hasLeft = false;

      const leave = () => {
        if (hasLeft) {
          return;
        }

        hasLeft = true;
        clearTimeout(giveUp);
        leaving.kill(leaving.pid, signal);
      };

      const giveUp = setTimeout(leave, GOODBYE_WITHIN_MS);

      stop(leave);
    });
  }
};

export type { Leaving };

export { GOODBYE_WITHIN_MS, stopAnnouncingOnExit };
