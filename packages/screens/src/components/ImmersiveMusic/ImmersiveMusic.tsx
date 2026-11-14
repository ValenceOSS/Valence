import { LikeTrackButton } from '@ValenceScreens/components/LikeTrackButton/LikeTrackButton';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useDragControls, useReducedMotionConfig } from 'motion/react';
import { Volume as VolumeIcon, VolumeLow as VolumeLowIcon, X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Slider } from '@ValenceUI/Slider';
import { cn } from '@ValenceUI/cn';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { CoverGlow } from '@ValenceScreens/components/CoverGlow/CoverGlow';
import { LyricLines } from '@ValenceScreens/components/LyricLines/LyricLines';
import { QueuePanel } from '@ValenceScreens/components/MusicPage/components/QueuePanel/QueuePanel';
import { MusicTransport } from '@ValenceScreens/components/MusicTransport/MusicTransport';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { setMusicImmersive, useMusicImmersive } from '@ValenceScreens/music/musicImmersive';
import { useSongLyrics } from '@ValenceScreens/music/useSongLyrics';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import type { ImmersiveMusicProps } from './ImmersiveMusic.types';
import { say } from '@ValenceI18n/say';

const OPENING = { duration: 0.28, ease: [0.23, 1, 0.32, 1] } as const;

const CLOSING = { duration: 0.18, ease: [0.23, 1, 0.32, 1] } as const;

const CLOSES_PAST = 140;

const THROWN_FOR = 0.2;

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
 * It opens by the cover on the player growing into place, and the player steps aside while it is
 * open — the view carries its own quiet controls, with the words or the queue beside them. Escape,
 * the close button or pulling it down by its handle put it away, a quick flick being enough. It
 * closes itself when nothing is playing.
 *
 * @param player - The player to show, which is the window's own unless a test says otherwise.
 */
const ImmersiveMusic = ({ player: given }: ImmersiveMusicProps) => {
  const isOpen = useMusicImmersive();
  const { state, player, shown, lyrics, isReading, at } = useSongLyrics(
    given ?? theMusicPlayer(),
    isOpen,
  );
  const prefersReducedMotion = useReducedMotionConfig();
  const dragging = useDragControls();
  const [showing, setShowing] = useState<'lyrics' | 'queue'>('lyrics');
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

  return (
    <AnimatePresence>
      {!isOpen || shown === null ? null : (
        <motion.section
          key="immersive"
          aria-label={say('screens.immersiveMusic.titleImmersive', { title: shown.title })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: CLOSING }}
          transition={OPENING}
          drag={isStill ? false : 'y'}
          dragControls={dragging}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, { offset, velocity }) => {
            if (offset.y + velocity.y * THROWN_FOR > CLOSES_PAST) {
              setMusicImmersive(false);
            }
          }}
          className="fixed inset-x-0 bottom-0 top-[var(--valence-window-bar)] z-[35] overflow-hidden text-on-scrim"
        >
          <CoverGlow src={cover} className="absolute inset-0" />

          <div
            aria-hidden
            className="absolute inset-x-0 top-0 z-10 flex h-10 cursor-grab touch-none justify-center pt-3 active:cursor-grabbing"
            onPointerDown={(event) => {
              dragging.start(event);
            }}
          >
            <span className="h-1 w-10 rounded-full bg-on-scrim/40" />
          </div>

          <div className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] end-4 z-10 flex items-center gap-2">
            <Button
              variant="overlay"
              isIconOnly
              label={say('common.close')}
              onClick={() => {
                setMusicImmersive(false);
              }}
            >
              <Icon of={XIcon} size={20} />
            </Button>
          </div>

          <div className="relative mx-auto grid h-full max-w-[88rem] grid-cols-1 items-start gap-10 overflow-y-auto overscroll-contain px-6 py-14 sm:px-12 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-center lg:gap-24 lg:overflow-y-visible lg:px-20">
            <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-6">
              <MusicArtwork
                src={cover}
                label={shown.title}
                isLifted
                travelsAs="now-playing"
                className="w-full"
              />

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
                    <h2 className="truncate text-2xl font-bold tracking-[-0.02em]">
                      {shown.title}
                    </h2>
                    <p className="truncate text-on-scrim/65">
                      {[shown.artists.map((artist) => artist.name).join(', '), shown.albumTitle]
                        .filter((part) => part !== null && part !== '')
                        .join(' — ')}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <LikeTrackButton trackId={shown.trackId} title={shown.title} />
              </div>

              <MusicTransport state={state} shown={shown} player={player} look="immersive" />

              <div className="flex items-center gap-3 text-on-scrim/60">
                <Icon of={VolumeLowIcon} size={16} />
                <Slider
                  label={say('common.volume')}
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

            <div className="flex h-[75svh] min-h-0 flex-col gap-4 lg:h-[80svh]">
              <div className="flex shrink-0 gap-1">
                {(['lyrics', 'queue'] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant="bare"
                    size="none"
                    hasTooltip={false}
                    aria-pressed={showing === tab}
                    className={cn(
                      'rounded-[0.875rem] px-4 py-2 text-sm font-semibold transition-colors duration-[var(--duration-fast)]',
                      showing === tab
                        ? 'bg-on-scrim text-shade'
                        : 'text-on-scrim/70 hover-hover:hover:text-on-scrim',
                    )}
                    onClick={() => {
                      setShowing(tab);
                    }}
                  >
                    {tab === 'lyrics' ? say('common.lyrics') : say('common.queue')}
                  </Button>
                ))}
              </div>

              {showing === 'queue' ? (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain text-on-scrim">
                  <QueuePanel />
                </div>
              ) : (
                <div className="valence-rail min-h-0 flex-1 overflow-y-auto overscroll-contain py-[30vh] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
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
                          {isReading ? '' : say('common.noLyricsFound')}
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
              )}
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

ImmersiveMusic.displayName = 'ImmersiveMusic';

export { ImmersiveMusic };
