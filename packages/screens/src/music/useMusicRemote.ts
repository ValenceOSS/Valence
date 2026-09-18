import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { watchMusicDevices } from '@ValenceClient/music/watchMusicDevices';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { theMusicPlayer } from './theMusicPlayer';
import type { MusicPlayer } from './createMusicPlayer';

/**
 * Lets this person's other devices drive this one, and keeps the list of them fresh.
 *
 * Mounted once for a signed-in window. A command another device sends arrives through presence and
 * goes straight to the player; news that a device opened, closed or started playing refreshes the
 * device list and the "playing on" bar rather than leaving them to poll.
 *
 * @param player - The player commands go to, which is the window's own unless a test says otherwise.
 */
const useMusicRemote = (player: MusicPlayer = theMusicPlayer()): void => {
  const cache = useQueryClient();

  useEffect(() => {
    const stopObeying = onPresenceEvent((event) => {
      if (event.kind === 'music') {
        player.obey(event.command);
      }
    });

    const stopWatching = watchMusicDevices(() => {
      void cache.invalidateQueries({ queryKey: musicQueries.devices().queryKey });
    });

    return () => {
      stopObeying();
      stopWatching();
    };
  }, [cache, player]);
};

export { useMusicRemote };
