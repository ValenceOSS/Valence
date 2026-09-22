import { useEffect, useRef } from 'react';
import { isTheDesktopClient, nowWatching } from '@ValenceScreens/desktop/theDesktopShell';
import { theTracksArtworkUrl } from '@ValenceScreens/music/theTracksArtworkUrl';
import type { WhatIsPlaying } from '@ValenceScreens/music/useWhatIsPlaying';

const A_SECOND = 1000;

const REFRESHED_EVERY = 15;

type DiscordMusicPresence = {
  playing: WhatIsPlaying | null;
  isAllowed: boolean;
  party?: { id: string; size: number } | null;
};

/**
 * Says what somebody is listening to, for the window to publish to Discord.
 *
 * The bar this reads from is mounted for as long as the application is, so there is no player to
 * leave the way there is for video — what changes is only whether a track is playing, which this
 * follows directly rather than watching for a mount and an unmount that never come.
 *
 * Everything else follows `useDiscordPresence`: the times are sent rather than a position, so
 * Discord counts for itself; a pause keeps the track named and takes the clock off rather than
 * freezing it; and nothing is said at all outside the desktop client or where the profile did not
 * ask for it.
 *
 * @param presence - What is playing, whether this profile wants it published, and the listening
 *   party it is playing in, where there is one.
 */
const useDiscordMusicPresence = ({
  playing,
  isAllowed,
  party = null,
}: DiscordMusicPresence): void => {
  const trackId = playing?.trackId ?? null;
  const title = playing?.title ?? '';
  const artistNames = playing?.artists.map((artist) => artist.name) ?? [];
  const artistsKey = artistNames.join(', ');
  const durationSeconds = playing?.durationSeconds ?? 0;
  const isPlaying = playing?.isPlaying ?? false;
  const positionSeconds = playing?.positionSeconds ?? 0;
  const artwork =
    playing === null ? null : theTracksArtworkUrl(playing.albumId, playing.hasArtwork);
  const shouldSay = isAllowed && isTheDesktopClient() && playing !== null;
  const position = useRef(positionSeconds);
  const artists = useRef(artistNames);
  const refresh = Math.round(positionSeconds / REFRESHED_EVERY);

  useEffect(() => {
    position.current = positionSeconds;
  });

  useEffect(() => {
    artists.current = artistNames;
  });

  useEffect(
    () => () => {
      nowWatching(isAllowed && isTheDesktopClient() ? { kind: 'browsing' } : null);
    },
    [isAllowed],
  );

  useEffect(() => {
    if (!shouldSay) {
      nowWatching(isAllowed && isTheDesktopClient() ? { kind: 'browsing' } : null);

      return;
    }

    const at = Math.max(Math.round(position.current), 0);
    const startedAt = Date.now() - at * A_SECOND;
    const runs = durationSeconds > 0 ? Math.round(durationSeconds) : null;

    nowWatching({
      kind: 'listening',
      title,
      artists: artists.current,
      startedAt,
      endsAt: runs === null ? null : startedAt + runs * A_SECOND,
      isPaused: !isPlaying,
      artwork,
      party,
    });
  }, [
    shouldSay,
    trackId,
    isPlaying,
    title,
    artistsKey,
    refresh,
    isAllowed,
    durationSeconds,
    artwork,
    party,
  ]);
};

export type { DiscordMusicPresence };

export { useDiscordMusicPresence };
