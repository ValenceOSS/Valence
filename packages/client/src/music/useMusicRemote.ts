import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { onPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { watchMusicDevices } from '@ValenceClient/music/watchMusicDevices';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';

const FRESH_FOR_MS = 45_000;

/**
 * Lets this person's other devices drive this one, and keeps the list of them fresh.
 *
 * Mounted once for a signed-in window. A command another device sends arrives through presence and
 * goes straight to the player; news that a device opened, closed or started playing refreshes the
 * device list and the "playing on" bar rather than leaving them to poll. While this window is
 * controlling another device, what that device says it is doing — its song, what plays after it,
 * its volume — is mirrored here, so the queue and the volume shown are that device's rather than
 * whatever this window last had.
 *
 * A window with nothing of its own playing follows another of this person's devices the moment
 * that one is playing, whether it already was when the window opened or starts later, as a music
 * app does: what it plays is shown at once and can be driven from here, without anything being sent
 * to it until somebody does. Only a device that has said so lately is followed, since one that went
 * quiet may have stopped without saying.
 *
 * @param player - The player commands go to, which is the window's own unless a test says otherwise.
 */
const useMusicRemote = (player: MusicPlayer = theMusicPlayer()): void => {
  const cache = useQueryClient();
  const { state } = useMusicPlayer(player);
  const remoteId = state.remote?.clientId ?? null;
  const isIdle = remoteId === null && !state.isPlaying && !state.isLoading;
  const devices = useQuery({ ...musicQueries.devices(), enabled: remoteId !== null || isIdle });
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
    if (!isIdle || devices.data === undefined) {
      return;
    }

    const here = platformInUse().thisClientId();
    const playing = devices.data.find(
      (device) =>
        device.clientId !== here &&
        device.nowPlaying?.isPlaying === true &&
        Date.now() - device.nowPlaying.reportedAtMs < FRESH_FOR_MS,
    );

    if (playing !== undefined) {
      player.follow({ clientId: playing.clientId, label: playing.label });
    }
  }, [devices.data, isIdle, player]);

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
