import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { canKeepFiles } from '@ValenceClient/downloads/canKeepFiles';
import { keepAFile } from '@ValenceClient/downloads/keepingFiles';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { noticeOnThisDevice } from '@ValenceClient/notifications/noticeOnThisDevice';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import { say } from '@ValenceI18n/say';

const STARTED_HERE = 'valence.downloads.startedHere';

const StartedSchema = z.array(z.string());

/**
 * Where the device store keeps the downloads one profile has begun fetching here. Each profile asks
 * for its own downloads, so each keeps its own list, and one profile's list being tidied never
 * forgets what another already fetched.
 *
 * @param profileId - The profile.
 * @returns The key.
 */
const startedKeyOf = (profileId: string): string => `${STARTED_HERE}.${profileId}`;

/**
 * Which downloads this device has already begun fetching by itself for a profile, as the device
 * store keeps them, starting from the one list every profile shared before each kept its own.
 *
 * @param profileId - The profile.
 * @returns Their ids.
 */
const readStarted = (profileId: string): Set<string> => {
  const store = platformInUse().store;
  const stored = store.read(startedKeyOf(profileId)) ?? store.read(STARTED_HERE);

  try {
    const read = StartedSchema.safeParse(stored === null ? [] : JSON.parse(stored));

    return new Set(read.success ? read.data : []);
  } catch {
    return new Set();
  }
};

/**
 * Fetches onto this device whatever was asked for on it, the moment the server has it ready, and
 * says so once it has landed.
 *
 * Asking for a download is asking for it here, so nobody should have to come back and ask a second
 * time. Each one is started once and only once: a file somebody later deletes from this device is
 * not fetched again behind their back, and a device that did not ask is left to be asked.
 *
 * A browser keeps nothing, so there this does nothing at all and the file is saved instead. Each
 * profile keeps its own list of what was begun, and downloads read before another profile took over
 * are left until they have been read again as them, so one profile's list is never checked against
 * another's downloads.
 */
const useFetchWhatThisDeviceAsked = (): void => {
  const isKeepable = canKeepFiles();
  const asked = useQuery({ ...downloadQueries.all(), enabled: isKeepable });
  const held = useHeldFiles();
  const wasFetching = useRef(new Map<string, HeldFile>());
  const watcher = useWatchingProfile();
  const movedOn = useRef<{ from: string | null; atMs: number }>({ from: null, atMs: 0 });

  useEffect(() => {
    if (watcher === null) {
      return;
    }

    if (movedOn.current.from !== null && movedOn.current.from !== watcher) {
      movedOn.current = { from: watcher, atMs: Date.now() };
    } else {
      movedOn.current = { ...movedOn.current, from: watcher };
    }
  }, [watcher]);

  useEffect(() => {
    if (
      !isKeepable ||
      asked.data === undefined ||
      watcher === null ||
      asked.dataUpdatedAt < movedOn.current.atMs
    ) {
      return;
    }

    const platform = platformInUse();
    const me = platform.thisClientId();
    const started = readStarted(watcher);
    const onThisDevice = new Set(held.map((file) => file.downloadId));

    for (const download of asked.data) {
      if (
        download.state === 'ready' &&
        download.askedFrom === me &&
        !onThisDevice.has(download.id) &&
        !started.has(download.id)
      ) {
        started.add(download.id);
        void keepAFile(download);
      }
    }

    const stillAsked = new Set(asked.data.map((download) => download.id));

    platform.store.write(
      startedKeyOf(watcher),
      JSON.stringify([...started].filter((id) => stillAsked.has(id))),
    );
  }, [isKeepable, asked.data, asked.dataUpdatedAt, held, watcher]);

  useEffect(() => {
    for (const file of held) {
      const before = wasFetching.current.get(file.downloadId);

      if (before !== undefined && file.state === 'here') {
        noticeOnThisDevice({
          title: say('client.downloads.useFetchWhatThisDeviceAsked.titleIsOnThisDevice', {
            title: file.title,
          }),
          body: say('client.downloads.useFetchWhatThisDeviceAsked.itIsReadyToWatchOffline'),
        });
      }
    }

    wasFetching.current = new Map(
      held.filter((file) => file.state === 'fetching').map((file) => [file.downloadId, file]),
    );
  }, [held]);
};

export { useFetchWhatThisDeviceAsked };
