import { useEffect, useRef } from 'react';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import {
  artworkFetchedForTheSystem,
  artworkTheSystemAccepts,
} from '@ValenceScreens/playback/artworkTheSystemAccepts';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { say } from '@ValenceI18n/say';
import { claimTheSystemsControls } from '@ValenceScreens/playback/claimTheSystemsControls';
import type { Claim } from '@ValenceScreens/playback/claimTheSystemsControls';

const A_SKIP = 10;

const POSTER_SIZES = ['256x384', '512x768'] as const;

type NowPlaying = {
  media: Pick<MediaSummary, 'id' | 'title'> &
    Partial<
      Pick<
        MediaSummary,
        'seriesTitle' | 'seasonNumber' | 'episodeNumber' | 'episodeNumberEnd' | 'hasPoster'
      >
    >;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
};

/**
 * The system's own media controls, where this engine has them.
 *
 * Asked for by value rather than by name, because the type says it is always there and it is not:
 * an older engine has none of this, and a name that exists holding nothing would pass a check for
 * the name and then throw on the first film somebody plays.
 *
 * @returns The controls, or nothing where the engine offers none.
 */
const theSystemsControls = (): MediaSession | null =>
  typeof navigator.mediaSession === 'object' && typeof MediaMetadata === 'function'
    ? navigator.mediaSession
    : null;

/**
 * Names the episode a programme belongs to, the way somebody would say it.
 *
 * @param media - What is playing.
 * @returns The line to put under the title, or nothing where there is nothing to say.
 */
const whichEpisode = (media: NowPlaying['media']): string => {
  const { seasonNumber, episodeNumber } = media;

  if (typeof seasonNumber !== 'number' || typeof episodeNumber !== 'number') {
    return '';
  }

  return say('screens.playback.useNowPlaying.seriesSeasonNumberEpisodeEpisodeNumber', {
    seasonNumber: seasonNumber.toString(),
    episodeNumber: describeEpisodeNumbers(episodeNumber, media.episodeNumberEnd),
  });
};

/**
 * Tells the operating system what is playing, so its own controls say so.
 *
 * A browser engine works out on its own that a `video` element is playing and offers the system a
 * play button for it. What it cannot work out is what the film is called — which is why the system
 * shows the application's name and a blank square until somebody says otherwise.
 *
 * Everything here is the Media Session API, so it is as true of a browser as of the desktop client:
 * the same lock screen on a phone, the same Now Playing panel on a Mac, the same media keys.
 *
 * The buttons are wired to the player's own handlers rather than to the element, because pausing
 * during a watch party is a message to everybody watching rather than a change to this machine — and
 * a play button on a menu bar that quietly desynchronised four people would be worse than no button.
 *
 * The controls are claimed as the music and an audiobook claim them, so music left paused beneath a
 * film keeps no button of its own on them while the film plays, and has its own back when the film
 * closes.
 *
 * @param nowPlaying - What is playing, where it is up to, and how to change that.
 */
const useNowPlaying = ({
  media,
  isPlaying,
  positionSeconds,
  durationSeconds,
  onTogglePlay,
  onSeek,
}: NowPlaying): void => {
  const { id, title, seriesTitle, hasPoster } = media;
  const episode = whichEpisode(media);
  const whole = Math.floor(positionSeconds);
  const claimRef = useRef<Claim | null>(null);
  const latest = useRef({ isPlaying, positionSeconds, durationSeconds, onTogglePlay, onSeek });

  useEffect(() => {
    latest.current = { isPlaying, positionSeconds, durationSeconds, onTogglePlay, onSeek };
  });

  useEffect(() => {
    if (theSystemsControls() === null) {
      return;
    }

    const goTo = (seconds: number) => {
      const { durationSeconds: duration } = latest.current;

      latest.current.onSeek(Math.min(Math.max(seconds, 0), duration > 0 ? duration : seconds));
    };
    const toggle = () => {
      latest.current.onTogglePlay();
    };
    const handlers = [
      ['play', toggle],
      ['pause', toggle],
      [
        'seekbackward',
        (details) => {
          goTo(latest.current.positionSeconds - (details.seekOffset ?? A_SKIP));
        },
      ],
      [
        'seekforward',
        (details) => {
          goTo(latest.current.positionSeconds + (details.seekOffset ?? A_SKIP));
        },
      ],
      [
        'seekto',
        (details) => {
          if (typeof details.seekTime === 'number') {
            goTo(details.seekTime);
          }
        },
      ],
    ] as const satisfies readonly (readonly [MediaSessionAction, MediaSessionActionHandler])[];
    const controlsWith = (artwork: { src: string; sizes: string }[]) => ({
      metadata: {
        title,
        artist:
          typeof seriesTitle === 'string' && seriesTitle !== ''
            ? seriesTitle
            : say('common.valence'),
        album: episode,
        artwork,
      },
      handlers,
    });

    const poster = artworkUrl(id, 'poster');
    const straight = hasPoster === true ? artworkTheSystemAccepts(poster) : null;
    const claim = claimTheSystemsControls(
      controlsWith(
        straight === null ? [] : POSTER_SIZES.map((sizes) => ({ src: straight, sizes })),
      ),
    );

    claimRef.current = claim;
    claim.setPlaying(latest.current.isPlaying);

    let held: string | null = null;
    let drawn = true;

    if (hasPoster === true && straight === null) {
      void artworkFetchedForTheSystem(poster).then((fetched) => {
        if (fetched === null) {
          return;
        }

        if (!drawn) {
          URL.revokeObjectURL(fetched);

          return;
        }

        held = fetched;
        claim.update(controlsWith(POSTER_SIZES.map((sizes) => ({ src: fetched, sizes }))));
      });
    }

    return () => {
      drawn = false;
      claimRef.current = null;
      claim.release();

      if (held !== null) {
        URL.revokeObjectURL(held);
      }
    };
  }, [id, title, seriesTitle, episode, hasPoster]);

  useEffect(() => {
    claimRef.current?.setPlaying(isPlaying);
  }, [isPlaying, id, title, seriesTitle, episode, hasPoster]);

  useEffect(() => {
    if (durationSeconds <= 0) {
      return;
    }

    claimRef.current?.setPosition({
      duration: durationSeconds,
      position: Math.min(Math.max(whole, 0), durationSeconds),
      playbackRate: 1,
    });
  }, [whole, durationSeconds, id, title, seriesTitle, episode, hasPoster]);
};

export type { NowPlaying };

export { useNowPlaying };
