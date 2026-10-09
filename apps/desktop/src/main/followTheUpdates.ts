import type { UpdateCheckResult } from 'electron-updater';
import type { DesktopUpdate } from '@ValenceContracts/schemas/DesktopUpdate';

type Updater = {
  checkForUpdates: () => Promise<UpdateCheckResult | null>;
  downloadUpdate: () => Promise<string[]>;
  quitAndInstall: (isSilent?: boolean, isForceRunAfter?: boolean) => void;
  on(event: 'update-available', listener: (info: { version: string }) => void): void;
  on(event: 'download-progress', listener: (progress: { percent: number }) => void): void;
  on(event: 'update-downloaded', listener: (info: { version: string }) => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
};

type FollowTheUpdatesNeeds = {
  updater: Updater;
  every?: number;
  onChange: (update: DesktopUpdate) => void;
  log: (line: string) => void;
};

type FollowedUpdates = {
  now: () => DesktopUpdate;
  checkNow: () => void;
  download: () => void;
  stop: () => void;
};

const CHECK_EVERY = 6 * 60 * 60 * 1000;

/**
 * Watches for a release newer than this build, and fetches it only once somebody says to.
 *
 * Finding a release and fetching it are two decisions, and only the first is this client's. A
 * release is looked for as this starts and every few hours after, and what is found is offered —
 * nothing is downloaded until somebody asks for it. Once they have, the download runs with its
 * progress on show, and the moment it is on disk the client restarts into it: they have already said
 * yes, and asking them twice is asking them to click the same thing again.
 *
 * A download that fails says so and can be asked for again. A check that fails is written down and
 * otherwise left to the next one, since a laptop that is offline has not found a broken release.
 *
 * Somebody can also ask for a check themselves. It looks straight away and starts the wait for the
 * next one again from there, and asking while a check is already out does nothing more.
 *
 * @param needs - What checks, how often to ask it to, who hears what it has come to, and where to
 *   write down what it did.
 * @returns What is known now, the way to look again now, the way to fetch it, and the way to stop
 *   looking.
 */
const followTheUpdates = ({
  updater,
  every = CHECK_EVERY,
  onChange,
  log,
}: FollowTheUpdatesNeeds): FollowedUpdates => {
  let update: DesktopUpdate = { kind: 'none' };
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let isChecking = false;

  const become = (next: DesktopUpdate): void => {
    update = next;
    onChange(next);
  };

  updater.on('update-available', (info) => {
    if (update.kind === 'downloading') {
      return;
    }

    if (update.kind !== 'none' && update.version === info.version) {
      return;
    }

    become({ kind: 'available', version: info.version });
  });

  updater.on('download-progress', (progress) => {
    if (update.kind !== 'downloading') {
      return;
    }

    const percent = Math.min(100, Math.max(0, Math.floor(progress.percent)));

    if (percent !== update.percent) {
      become({ kind: 'downloading', version: update.version, percent });
    }
  });

  updater.on('update-downloaded', (info) => {
    log(`Downloaded ${info.version}, restarting to install it`);
    updater.quitAndInstall(true, true);
  });

  updater.on('error', (error) => {
    log(`Failed: ${error.message}`);
  });

  const checkOnce = (): void => {
    const asking =
      update.kind === 'downloading' ? Promise.resolve(null) : updater.checkForUpdates();

    isChecking = true;

    void asking
      .catch(() => undefined)
      .finally(() => {
        isChecking = false;

        if (!stopped) {
          timer = setTimeout(checkOnce, every);
          timer.unref();
        }
      });
  };

  checkOnce();

  return {
    now: () => update,
    checkNow: () => {
      if (stopped || isChecking) {
        return;
      }

      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }

      checkOnce();
    },
    download: () => {
      if (update.kind !== 'available' && update.kind !== 'failed') {
        return;
      }

      const { version } = update;

      log(`Asked to download ${version}`);
      become({ kind: 'downloading', version, percent: 0 });

      void updater.downloadUpdate().catch(() => {
        if (update.kind === 'downloading') {
          become({ kind: 'failed', version });
        }
      });
    },
    stop: () => {
      stopped = true;

      if (timer !== null) {
        clearTimeout(timer);
      }
    },
  };
};

export type { FollowedUpdates, FollowTheUpdatesNeeds, Updater };

export { followTheUpdates };
