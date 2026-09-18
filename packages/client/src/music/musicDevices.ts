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
 * @returns The devices.
 */
const fetchMusicDevices = async (): Promise<MusicDevice[]> =>
  (await readFromServer('/api/music/devices', MusicDeviceListSchema, profileHeaders())).devices;

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
