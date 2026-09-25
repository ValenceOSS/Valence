import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { canKeepFiles } from '@ValenceClient/downloads/canKeepFiles';
import { keepAFile } from '@ValenceClient/downloads/keepingFiles';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';

const STARTED_HERE = 'valence.downloads.startedHere';

const StartedSchema = z.array(z.string());

/**
 * Which downloads this device has already begun fetching by itself, as the device store keeps them.
 *
 * @returns Their ids.
 */
const readStarted = (): Set<string> => {
  const stored = platformInUse().store.read(STARTED_HERE);

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
 * A browser keeps nothing, so there this does nothing at all and the file is saved instead.
 */
const useFetchWhatThisDeviceAsked = (): void => {
  const isKeepable = canKeepFiles();
  const asked = useQuery({ ...downloadQueries.all(), enabled: isKeepable });
  const held = useHeldFiles();
  const wasFetching = useRef(new Map<string, HeldFile>());

  useEffect(() => {
    if (!isKeepable || asked.data === undefined) {
      return;
    }

    const platform = platformInUse();
    const me = platform.thisClientId();
    const started = readStarted();
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
      STARTED_HERE,
      JSON.stringify([...started].filter((id) => stillAsked.has(id))),
    );
  }, [isKeepable, asked.data, held]);

  useEffect(() => {
    for (const file of held) {
      const before = wasFetching.current.get(file.downloadId);

      if (before !== undefined && file.state === 'here') {
        platformInUse().notifyLocally({
          title: `${file.title} is on this device`,
          body: 'It is ready to watch offline.',
        });
      }
    }

    wasFetching.current = new Map(
      held.filter((file) => file.state === 'fetching').map((file) => [file.downloadId, file]),
    );
  }, [held]);
};

export { useFetchWhatThisDeviceAsked };
