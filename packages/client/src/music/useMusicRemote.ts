import { useEffect, useRef } from 'react';
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
 * that one starts playing, or one already was when the window opened, as a music app does: what it
 * plays is shown at once and can be driven from here, without anything being sent to it until
 * somebody does. It follows a device starting, never one carrying on — the device it has just
 * taken the music from is still saying it plays for a moment, and following that would hand the
 * music straight back. Only a device that has said so lately counts, since one that went quiet may
 * have stopped without saying.
 *
 * @param player - The player commands go to, which is the window's own unless a test says otherwise.
 */
const useMusicRemote = (player: MusicPlayer = theMusicPlayer()): void => {
  const cache = useQueryClient();
  const { state } = useMusicPlayer(player);
  const remoteId = state.remote?.clientId ?? null;
  const isIdle = remoteId === null && !state.isPlaying && !state.isLoading;
  const devices = useQuery({ ...musicQueries.devices(), enabled: remoteId !== null || isIdle });
  const seenPlaying = useRef<ReadonlySet<string> | null>(null);
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
    if (devices.data === undefined) {
      return;
    }

    const here = platformInUse().thisClientId();
    const playingNow = new Set(
      devices.data
        .filter(
          (device) =>
            device.clientId !== here &&
            device.nowPlaying?.isPlaying === true &&
            Date.now() - device.nowPlaying.reportedAtMs < FRESH_FOR_MS,
        )
        .map((device) => device.clientId),
    );
    const wasPlaying = seenPlaying.current;

    seenPlaying.current = playingNow;

    if (!isIdle) {
      return;
    }

    const started = [...playingNow].find((clientId) => wasPlaying?.has(clientId) !== true);
    const device = devices.data.find((one) => one.clientId === started);

    if (device !== undefined) {
      player.follow({ clientId: device.clientId, label: device.label });
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
