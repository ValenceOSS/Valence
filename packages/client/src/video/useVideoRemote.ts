import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  controlDevice,
  onControlledDevice,
  readControlledDevice,
} from '@ValenceClient/video/controlledDevice';
import { sendVideoCommand } from '@ValenceClient/video/videoDevices';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
import { whereItHasGot } from '@ValenceClient/video/whereItHasGot';
import type { ControlledDevice } from '@ValenceClient/video/controlledDevice';
import type { VideoCommand, VideoNowWatching } from '@ValenceContracts/schemas/VideoRemote';

const TICK_MS = 500;

type VideoRemote = {
  device: ControlledDevice | null;
  watching: VideoNowWatching | null;
  positionSeconds: number;
  send: (command: VideoCommand) => void;
  release: () => void;
};

/**
 * This device as the remote for another: which device it controls, what that one says it is
 * watching and where it has got to — moved on between reports so a scrubber keeps time — and how to
 * send it a command.
 *
 * Once the controlled device says it has stopped, or closes, this one stops being its remote — but
 * only after that very device has been seen watching, so moving on to another television that has
 * not said anything yet does not let go of it at once.
 *
 * @returns The remote.
 */
const useVideoRemote = (): VideoRemote => {
  const device = useSyncExternalStore(
    onControlledDevice,
    readControlledDevice,
    readControlledDevice,
  );
  const devices = useVideoDevices(device !== null);
  const [now, setNow] = useState(() => Date.now());
  const found =
    device === null ? undefined : devices.find((one) => one.clientId === device.clientId);
  const watching = found?.nowWatching ?? null;
  const [seenWatching, setSeenWatching] = useState<string | null>(null);
  const clientId = device?.clientId ?? null;

  useEffect(() => {
    if (clientId !== null && watching !== null) {
      setSeenWatching(clientId);
    }
  }, [clientId, watching]);

  useEffect(() => {
    if (clientId !== null && seenWatching === clientId && watching === null) {
      controlDevice(null);
    }
  }, [clientId, seenWatching, watching]);

  const isPlaying = watching?.isPlaying ?? false;

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);

    return () => {
      clearInterval(timer);
    };
  }, [isPlaying]);

  return {
    device,
    watching,
    positionSeconds: watching === null ? 0 : whereItHasGot(watching, now),
    send: (command) => {
      if (device !== null) {
        void sendVideoCommand(device.clientId, command);
      }
    },
    release: () => {
      controlDevice(null);
    },
  };
};

export type { VideoRemote };

export { useVideoRemote };
