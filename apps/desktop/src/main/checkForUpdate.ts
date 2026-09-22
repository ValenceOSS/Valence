import type { UpdateCheckResult } from 'electron-updater';

type AvailableUpdate = { version: string };

type Updater = {
  checkForUpdates: () => Promise<UpdateCheckResult | null>;
  on: (event: 'update-downloaded', listener: (info: { version: string }) => void) => void;
};

type CheckForUpdateNeeds = {
  updater: Updater;
  every?: number;
  onReadyToInstall: (update: AvailableUpdate) => void;
};

type Stoppable = { stop: () => void };

const CHECK_EVERY = 6 * 60 * 60 * 1000;

/**
 * Watches for a release newer than this build, on a timer, for as long as somebody wants to know.
 *
 * The checking, the downloading and the comparing of versions all belong to `electron-updater`
 * already, so this is only the timer around it — asked once soon after this is asked to start, and
 * every few hours after that, which is as often as a release arrives. What is worth telling anybody
 * about is not that a check ran but that a download finished: only once the new build is actually
 * sitting on disk is there anything for a click to install, so this waits for `update-downloaded`
 * rather than for `update-available`.
 *
 * @param needs - What checks for an update, how often to ask it to, and what to do once one has
 *   finished downloading.
 * @returns The way to stop checking.
 */
const checkForUpdate = ({
  updater,
  every = CHECK_EVERY,
  onReadyToInstall,
}: CheckForUpdateNeeds): Stoppable => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  updater.on('update-downloaded', (info) => {
    onReadyToInstall({ version: info.version });
  });

  const checkOnce = (): void => {
    void updater
      .checkForUpdates()
      .catch(() => undefined)
      .finally(() => {
        if (!stopped) {
          timer = setTimeout(checkOnce, every);
          timer.unref();
        }
      });
  };

  checkOnce();

  return {
    stop: () => {
      stopped = true;

      if (timer !== null) {
        clearTimeout(timer);
      }
    },
  };
};

export type { AvailableUpdate, CheckForUpdateNeeds, Updater };

export { checkForUpdate };
