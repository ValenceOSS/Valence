import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import { PlaybackEventSchema } from '@ValenceContracts/schemas/MusicRemote';
import type { RealtimeClient } from '@ValenceClient/realtime/createRealtimeClient';

/**
 * Hears that this person's devices have changed — one opened or closed, or said it is playing or
 * watching something else — for music or for films, so the list of them is read again rather than
 * asked for every few seconds.
 *
 * @param which - Whether it is the music or the film devices that matter.
 * @param onChanged - Told each time they change.
 * @param client - The connection to listen on, which is the shared one unless a test says
 *   otherwise.
 * @returns The function that stops listening.
 */
const watchDeviceChanges = (
  which: 'musicDevicesChanged' | 'videoDevicesChanged',
  onChanged: () => void,
  client: RealtimeClient = getRealtimeClient(),
): (() => void) =>
  client.subscribe('playback', (event) => {
    const parsed = PlaybackEventSchema.safeParse(event.payload);

    if (parsed.success && parsed.data.kind === which) {
      onChanged();
    }
  });

export { watchDeviceChanges };
