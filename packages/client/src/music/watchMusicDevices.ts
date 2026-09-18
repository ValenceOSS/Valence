import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import { PlaybackEventSchema } from '@ValenceContracts/schemas/MusicRemote';
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
): (() => void) =>
  client.subscribe('playback', (event) => {
    const parsed = PlaybackEventSchema.safeParse(event.payload);

    if (parsed.success && parsed.data.kind === 'musicDevicesChanged') {
      onChanged();
    }
  });

export { watchMusicDevices };
