import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  controlDevice,
  isDismissed,
  noteWhoIsWatching,
  onControlledDevice,
  readControlledDevice,
} from '@ValenceClient/video/controlledDevice';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';

const FRESH_FOR_MS = 45_000;

/**
 * Makes this device the remote for a television of the same profile the moment the television
 * starts playing something, or for one already playing when this device opened, as music follows
 * another device — so a film started from the sofa with the television's own remote can be paused
 * from a phone without sending it there first.
 *
 * It follows a television starting, never one carrying on, and moves on to whichever starts next.
 * Only a television counts, since it alone obeys a remote, and only one that has said what it is
 * watching lately, since one that went quiet may have stopped without saying. Nothing is followed
 * while this device plays something of its own on screen, and a television whose remote was put
 * away is left alone until it has properly stopped.
 *
 * @param isBusy - Whether this device is showing a film of its own.
 */
const useFollowTheTelevision = (isBusy: boolean): void => {
  const controlled = useSyncExternalStore(
    onControlledDevice,
    readControlledDevice,
    readControlledDevice,
  );
  const devices = useVideoDevices();
  const seenWatching = useRef<ReadonlySet<string> | null>(null);
  const controlledId = controlled?.clientId ?? null;

  useEffect(() => {
    const now = Date.now();
    const televisions = devices.filter((device) => device.kind === 'tv');
    const watchingNow = new Set(
      televisions
        .filter(
          (device) =>
            device.nowWatching !== null && now - device.nowWatching.reportedAtMs < FRESH_FOR_MS,
        )
        .map((device) => device.clientId),
    );
    const wasWatching = seenWatching.current;

    seenWatching.current = watchingNow;
    noteWhoIsWatching(watchingNow, now);

    if (isBusy) {
      return;
    }

    const started = televisions.find(
      (device) =>
        watchingNow.has(device.clientId) &&
        device.clientId !== controlledId &&
        wasWatching?.has(device.clientId) !== true &&
        !isDismissed(device.clientId),
    );

    if (started !== undefined) {
      controlDevice({ clientId: started.clientId, label: started.label });
    }
  }, [devices, isBusy, controlledId]);
};

export { useFollowTheTelevision };
