import { readFromServer } from '@ValenceClient/query/readFromServer';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { VideoDeviceListSchema } from '@ValenceContracts/schemas/VideoRemote';
import type {
  VideoCommand,
  VideoDevice,
  VideoNowWatching,
} from '@ValenceContracts/schemas/VideoRemote';

/**
 * Every copy of Valence this profile has open, what kind of device each is, and what each says it
 * is watching.
 *
 * @returns The devices.
 */
const fetchVideoDevices = async (): Promise<VideoDevice[]> =>
  (await readFromServer('/api/video/devices', VideoDeviceListSchema, profileHeaders())).devices;

/**
 * Says what this device is watching, or that it has stopped, so this person's other devices can
 * show it and control it.
 *
 * @param nowWatching - What it is watching, or nothing.
 * @returns Whether the server heard it.
 */
const reportNowWatching = async (nowWatching: VideoNowWatching | null): Promise<boolean> => {
  const response = await fetch('/api/video/devices/now-watching', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { ...profileHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ clientId: platformInUse().thisClientId(), nowWatching }),
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Tells another of this person's devices to play a film, or to pause, move or stop the one it is
 * playing.
 *
 * @param clientId - The device.
 * @param command - What to do.
 * @returns Whether it was sent.
 */
const sendVideoCommand = async (clientId: string, command: VideoCommand): Promise<boolean> => {
  const response = await fetch(`/api/video/devices/${encodeURIComponent(clientId)}/command`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { ...profileHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ fromClientId: platformInUse().thisClientId(), command }),
  }).catch(() => null);

  return response !== null && response.ok;
};

export { fetchVideoDevices, reportNowWatching, sendVideoCommand };
