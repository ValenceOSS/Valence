import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { onPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { watchMusicDevices } from '@ValenceClient/music/watchMusicDevices';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';

/**
 * Lets this person's other devices drive this one, and keeps the list of them fresh.
 *
 * Mounted once for a signed-in window or phone. A command another device sends arrives through presence and
 * goes straight to the player; news that a device opened, closed or started playing refreshes the
 * device list and the "playing on" bar rather than leaving them to poll. While this window is
 * controlling another device, what that device says it is doing — its song, what plays after it,
 * its volume — is mirrored here, so the queue and the volume shown are that device's rather than
 * whatever this window last had.
 *
 * @param player - The player commands go to.
 * @param remoteId - The device this one is controlling, or nothing while it plays here.
 */
const useMusicRemote = (player: MusicPlayer, remoteId: string | null): void => {
  const cache = useQueryClient();
  const devices = useQuery({ ...musicQueries.devices(), enabled: remoteId !== null });
  const reported =
    remoteId === null
      ? null
      : (devices.data?.find((device) => device.clientId === remoteId)?.nowPlaying ?? null);

  useEffect(() => {
    if (reported !== null) {
      player.mirror(reported);
    }
  }, [reported, player]);

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
