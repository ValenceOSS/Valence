import { readFromServer } from '@ValenceClient/query/readFromServer';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { MusicDeviceListSchema } from '@ValenceContracts/schemas/MusicRemote';
import type {
  MusicCommand,
  MusicDevice,
  MusicNowPlaying,
} from '@ValenceContracts/schemas/MusicRemote';

/**
 * Reads every open copy of Valence this profile has, and what each is playing.
 *
 * When each device last said what it was playing is put on this device's own clock, from how long
 * ago the server heard it, rather than taken as the other device wrote it: two devices' clocks are
 * rarely set the same, and a second between them put the song a second out wherever it was shown.
 *
 * @param now - This device's clock.
 * @returns The devices.
 */
const fetchMusicDevices = async (now: () => number = Date.now): Promise<MusicDevice[]> => {
  const { devices } = await readFromServer(
    '/api/music/devices',
    MusicDeviceListSchema,
    profileHeaders(),
  );
  const heard = now();

  return devices.map((device) =>
    device.nowPlaying === null || device.ageMs === null
      ? device
      : { ...device, nowPlaying: { ...device.nowPlaying, reportedAtMs: heard - device.ageMs } },
  );
};

/**
 * Says what this device is playing, so this profile's other devices can show and control it.
 *
 * @param nowPlaying - What is playing, or nothing where this device has stopped.
 * @returns Whether it was heard.
 */
const reportNowPlaying = async (nowPlaying: MusicNowPlaying | null): Promise<boolean> => {
  const response = await fetch('/api/music/devices/now-playing', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { ...profileHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ clientId: platformInUse().thisClientId(), nowPlaying }),
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Tells another of this profile's devices to do something.
 *
 * @param clientId - The device.
 * @param command - What to do.
 * @returns Whether it was passed on.
 */
const sendMusicCommand = async (clientId: string, command: MusicCommand): Promise<boolean> => {
  const response = await fetch(`/api/music/devices/${encodeURIComponent(clientId)}/command`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { ...profileHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ fromClientId: platformInUse().thisClientId(), command }),
  }).catch(() => null);

  return response !== null && response.ok;
};

export { fetchMusicDevices, reportNowPlaying, sendMusicCommand };
