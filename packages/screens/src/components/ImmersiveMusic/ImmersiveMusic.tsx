import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import {
  Heart as HeartIcon,
  Volume as VolumeIcon,
  VolumeLow as VolumeLowIcon,
  X as XIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Slider } from '@ValenceUI/Slider';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { lyricLineAt } from '@ValenceClient/music/lyricLineAt';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { BarButton } from '@ValenceScreens/components/BarButton/BarButton';
import { CoverGlow } from '@ValenceScreens/components/CoverGlow/CoverGlow';
import { LyricLines } from '@ValenceScreens/components/LyricLines/LyricLines';
import { MusicTransport } from '@ValenceScreens/components/MusicTransport/MusicTransport';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { setMusicImmersive, useMusicImmersive } from '@ValenceScreens/music/musicImmersive';
import { theMusicPlayer } from '@ValenceScreens/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { useWhatIsPlaying } from '@ValenceScreens/music/useWhatIsPlaying';
import type { ImmersiveMusicProps } from './ImmersiveMusic.types';

const OPENING = { duration: 0.28, ease: [0.23, 1, 0.32, 1] } as const;

const CLOSING = { duration: 0.18, ease: [0.23, 1, 0.32, 1] } as const;

const CHANGING = { duration: 0.35, ease: [0.23, 1, 0.32, 1] } as const;

/**
 * The song playing, filling the screen: its cover, blown up and blurred into light behind
 * everything; the cover itself with what the song is, a like, the time and the few controls it
 * needs beneath it and nothing else; and its words following along with every line but the one
 * being sung drifting out of focus.
 *
 * Moving to another song carries the view with it rather than cutting: the light behind slowly
 * dissolves into the next cover's, a new album's cover gives way to the old through a moment of
 * blur, the name rises in, and the old song's words fall away as the new one's come up.
 *
 * It opens from the cover on the player bar, and the bar steps aside while it is open — the view
 * carries its own quiet controls, so nothing but the music is on the screen. Escape, the close button or the cover again
 * put it away. It closes itself when nothing is playing.
 *
 * @param player - The player to show, which is the window's own unless a test says otherwise.
 */
const ImmersiveMusic = ({ player: given }: ImmersiveMusicProps) => {
  const isOpen = useMusicImmersive();
  const { state, player } = useMusicPlayer(given ?? theMusicPlayer(), { followsPosition: true });
  const shown = useWhatIsPlaying(state);
  const favourites = useFavourites(useWatchingProfile());
  const prefersReducedMotion = useReducedMotionConfig();
  const trackId = shown?.trackId ?? null;
  const asked = useQuery({
    ...musicQueries.lyrics(trackId ?? ''),
    enabled: isOpen && trackId !== null,
  });
  const lyrics = asked.data ?? null;
  const at =
    lyrics === null || !lyrics.isSynced
      ? -1
      : lyricLineAt(lyrics.lines, (shown?.positionSeconds ?? 0) * 1000);
  const cover = shown !== null && shown.hasArtwork ? albumArtworkUrl(shown.albumId) : null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        setMusicImmersive(false);
      }
    };

    window.addEventListener('keydown', onKey, { capture: true });

    return () => {
      window.removeEventListener('keydown', onKey, { capture: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (shown === null && isOpen) {
      setMusicImmersive(false);
    }
  }, [shown, isOpen]);

  const isStill = prefersReducedMotion === true;
  const isLiked = shown !== null && favourites.isKept(shown.trackId);

  return (
    <AnimatePresence>
      {!isOpen || shown === null ? null : (
        <motion.section
          key="immersive"
          aria-label={`${shown.title}, immersive`}
          initial={isStill ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
          animate={isStill ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={
            isStill
              ? { opacity: 0, transition: CLOSING }
              : { opacity: 0, scale: 1.02, transition: CLOSING }
          }
          transition={OPENING}
          className="fixed inset-0 z-[35] overflow-hidden text-on-scrim"
        >
          <CoverGlow src={cover} className="absolute inset-0" />

          <Button
            variant="overlay"
            isIconOnly
            label="Close"
            className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 z-10"
            onClick={() => {
              setMusicImmersive(false);
            }}
          >
            <Icon of={XIcon} size={20} />
          </Button>

          <div className="relative mx-auto grid h-full max-w-[88rem] grid-cols-1 items-start gap-10 overflow-y-auto overscroll-contain px-6 py-16 sm:px-12 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-center lg:gap-20 lg:overflow-y-visible lg:px-20">
            <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-6">
              <div className="relative aspect-square w-full">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={shown.albumId}
                    initial={
                      isStill ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: 'blur(6px)' }
                    }
                    animate={
                      isStill ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }
                    }
                    exit={
                      isStill ? { opacity: 0 } : { opacity: 0, scale: 1.04, filter: 'blur(6px)' }
                    }
                    transition={isStill ? CLOSING : CHANGING}
                    className="absolute inset-0"
                  >
                    <MusicArtwork src={cover} label={shown.title} isLifted className="w-full" />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between gap-4">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={shown.trackId}
                    initial={isStill ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={isStill ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={isStill ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={CLOSING}
                    className="flex min-w-0 flex-col"
                  >
                    <h2 className="truncate text-lg font-semibold tracking-[-0.01em]">
                      {shown.title}
                    </h2>
                    <p className="truncate text-on-scrim/65">
                      {[shown.artists.map((artist) => artist.name).join(', '), shown.albumTitle]
                        .filter((part) => part !== null && part !== '')
                        .join(' — ')}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <BarButton
                  label={isLiked ? `Unlike ${shown.title}` : `Like ${shown.title}`}
                  glyph={HeartIcon}
                  gesture="fill"
                  isLit={isLiked}
                  onClick={() => {
                    favourites.toggle(shown.trackId);
                  }}
                />
              </div>

              <MusicTransport state={state} shown={shown} player={player} look="immersive" />

              <div className="flex items-center gap-3 text-on-scrim/60">
                <Icon of={VolumeLowIcon} size={16} />
                <Slider
                  label="Volume"
                  tone="overlay"
                  value={Math.round((state.isMuted ? 0 : shown.volume) * 100)}
                  max={100}
                  step={1}
                  valueLabel={(value) => `${value.toString()}%`}
                  className="min-w-0 flex-1"
                  onValueChange={(value) => {
                    player.setVolume(value / 100);
                  }}
                />
                <Icon of={VolumeIcon} size={16} />
              </div>
            </div>

            <div className="valence-rail h-[75svh] min-h-0 overflow-y-auto overscroll-contain py-[30vh] lg:h-full [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${shown.trackId}-${lyrics === null ? 'none' : 'some'}`}
                  initial={isStill ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  animate={isStill ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={isStill ? { opacity: 0 } : { opacity: 0, y: -16 }}
                  transition={CHANGING}
                >
                  {lyrics === null || lyrics.lines.length === 0 ? (
                    <p className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-on-scrim/60">
                      {asked.isPending ? '' : 'No lyrics found'}
                    </p>
                  ) : (
                    <LyricLines
                      lyrics={lyrics}
                      at={at}
                      look="immersive"
                      onSeek={(seconds) => {
                        player.seek(seconds);
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

ImmersiveMusic.displayName = 'ImmersiveMusic';

export { ImmersiveMusic };
