import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import { watchDeviceChanges } from '@ValenceClient/devices/watchDeviceChanges';
import type { RealtimeClient } from '@ValenceClient/realtime/createRealtimeClient';

/**
 * Listens for this profile's devices changing — one opening or closing, or one starting, pausing or
 * skipping a song — so a device list or a "playing on" bar can read them again rather than poll.
 *
 * @param onChanged - What to do when they change.
 * @param client - The socket to listen on.
 * @returns A way to stop listening.
 */
const watchMusicDevices = (
  onChanged: () => void,
  client: RealtimeClient = getRealtimeClient(),
): (() => void) => watchDeviceChanges('musicDevicesChanged', onChanged, client);

export { watchMusicDevices };
