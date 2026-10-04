import { useEffect, useRef } from 'react';
import { isTheDesktopClient, nowWatching } from '@ValenceScreens/desktop/theDesktopShell';
import { theTracksArtworkUrl } from '@ValenceScreens/music/theTracksArtworkUrl';
import { theListeningStatus } from '@ValenceScreens/playback/theListeningStatus';
import { theIdleStatus } from '@ValenceScreens/playback/theIdleStatus';
import { mayShowOnDiscord } from '@ValenceScreens/playback/mayShowOnDiscord';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import type { WhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';

const REFRESHED_EVERY = 15;

type DiscordMusicPresence = {
  playing: WhatIsPlaying | null;
  isAllowed: boolean;
  settings?: DiscordPresence;
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
 * Music can be left off by the profile, and so can a pause; either falls back to the idle status.
 *
 * @param presence - What is playing, whether this profile wants it published, how they want it
 *   shown, and the listening party it is playing in, where there is one.
 */
const useDiscordMusicPresence = ({
  playing,
  isAllowed,
  settings = DEFAULT_DISCORD_PRESENCE,
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
  const shouldSay =
    isAllowed &&
    isTheDesktopClient() &&
    playing !== null &&
    mayShowOnDiscord({ kind: 'track', isPlaying }, settings);
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
      nowWatching(theIdleStatus(isAllowed, settings));
    },
    [isAllowed, settings],
  );

  useEffect(() => {
    if (!shouldSay) {
      nowWatching(theIdleStatus(isAllowed, settings));

      return;
    }

    nowWatching(
      theListeningStatus({
        title,
        artists: artists.current,
        durationSeconds,
        positionSeconds: position.current,
        isPlaying,
        artwork,
        party,
        settings,
        now: Date.now(),
      }),
    );
  }, [
    shouldSay,
    settings,
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
