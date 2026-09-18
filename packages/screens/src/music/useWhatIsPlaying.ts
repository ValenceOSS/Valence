import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import type { MusicPlayerState, RemoteDevice } from './createMusicPlayer';

type ShownArtist = { id: string | null; name: string };

type WhatIsPlaying = {
  trackId: string;
  title: string;
  artists: ShownArtist[];
  albumId: string;
  albumTitle: string | null;
  hasArtwork: boolean;
  positionSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  remote: RemoteDevice | null;
};

const TICK_MS = 500;

/**
 * What the player bar should show: the song this device is playing, or — while this device is
 * controlling another — the song that one says it is playing, moved on by however long it has been
 * since it said so, so the bar keeps time without asking every second.
 *
 * @param state - What this device's player is doing.
 * @param now - The time, for moving a report on.
 * @returns What is playing, or nothing.
 */
const useWhatIsPlaying = (
  state: MusicPlayerState,
  now: () => number = Date.now,
): WhatIsPlaying | null => {
  const { remote, current } = state;
  const devices = useQuery({ ...musicQueries.devices(), enabled: remote !== null });
  const [, setTick] = useState(0);
  const reported =
    remote === null
      ? null
      : (devices.data?.find((device) => device.clientId === remote.clientId)?.nowPlaying ?? null);
  const isRemotePlaying = reported?.isPlaying === true;

  useEffect(() => {
    if (!isRemotePlaying) {
      return;
    }

    const timer = setInterval(() => {
      setTick((tick) => tick + 1);
    }, TICK_MS);

    return () => {
      clearInterval(timer);
    };
  }, [isRemotePlaying]);

  if (remote !== null) {
    if (reported === null) {
      return current === null
        ? null
        : {
            trackId: current.id,
            title: current.title,
            artists: current.artists,
            albumId: current.album.id,
            albumTitle: current.album.title,
            hasArtwork: current.album.hasArtwork,
            positionSeconds: 0,
            durationSeconds: current.durationSeconds,
            isPlaying: false,
            isLoading: true,
            volume: state.volume,
            remote,
          };
    }

    const moved = reported.isPlaying ? (now() - reported.reportedAtMs) / 1000 : 0;

    return {
      trackId: reported.trackId,
      title: reported.title,
      artists: reported.artists.map((name) => ({ id: null, name })),
      albumId: reported.albumId,
      albumTitle: null,
      hasArtwork: reported.hasArtwork,
      positionSeconds: Math.min(
        reported.durationSeconds,
        reported.positionSeconds + Math.max(0, moved),
      ),
      durationSeconds: reported.durationSeconds,
      isPlaying: reported.isPlaying,
      isLoading: false,
      volume: state.volume,
      remote,
    };
  }

  return current === null
    ? null
    : {
        trackId: current.id,
        title: current.title,
        artists: current.artists,
        albumId: current.album.id,
        albumTitle: current.album.title,
        hasArtwork: current.album.hasArtwork,
        positionSeconds: state.positionSeconds,
        durationSeconds: state.durationSeconds || current.durationSeconds,
        isPlaying: state.isPlaying,
        isLoading: state.isLoading,
        volume: state.volume,
        remote: null,
      };
};

export type { WhatIsPlaying };

export { useWhatIsPlaying };
