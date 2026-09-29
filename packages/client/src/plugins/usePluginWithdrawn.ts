import { useEffect, useRef } from 'react';
import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import { PluginChangeSchema } from '@ValenceContracts/schemas/Plugin';
import type { PluginChange } from '@ValenceContracts/schemas/Plugin';
import type { RealtimeClient } from '@ValenceClient/realtime/createRealtimeClient';

/**
 * Says when an administrator turns off or removes the plugin a screen is showing, so the screen can
 * take somebody somewhere that still exists rather than leaving them on a page that no longer does.
 *
 * @param pluginId - The plugin being shown, or nothing where the screen shows none.
 * @param onWithdrawn - Told the plugin was turned off or removed, and which.
 * @param client - The socket to listen on; the shared one unless a test hands its own.
 */
const usePluginWithdrawn = (
  pluginId: string | null,
  onWithdrawn: (change: PluginChange) => void,
  client: Pick<RealtimeClient, 'subscribe'> | null = getRealtimeClient(),
): void => {
  const told = useRef(onWithdrawn);

  useEffect(() => {
    told.current = onWithdrawn;
  });

  useEffect(() => {
    if (client === null || pluginId === null) {
      return;
    }

    return client.subscribe('plugins', (event) => {
      const read = PluginChangeSchema.safeParse(event.payload);

      if (
        read.success &&
        read.data.pluginId === pluginId &&
        (read.data.change === 'disabled' || read.data.change === 'removed')
      ) {
        told.current(read.data);
      }
    });
  }, [client, pluginId]);
};

export { usePluginWithdrawn };
