import {
  FavouriteIcon,
  LaptopIcon,
  LeftToRightListNumberIcon,
  Mic01Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatIcon,
  RepeatOne01Icon,
  ShuffleIcon,
  UserGroupIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute01Icon,
} from '@hugeicons/core-free-icons';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { GlassPanel } from '@ValenceUI/GlassPanel';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { Slider } from '@ValenceUI/Slider';
import { Spinner } from '@ValenceUI/Spinner';
import {
  fadeVariants,
  revealItemVariants,
  revealTransition,
  spring,
  stillTransition,
} from '@ValenceUI/animations/reveal';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import {
  AUDIO_QUALITIES,
  AUDIO_QUALITY_LABELS,
  AudioQualitySchema,
} from '@ValenceContracts/schemas/Music';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { setMusicPanel, useMusicPanel } from '@ValenceScreens/music/musicPanel';
import { useListeningParty } from '@ValenceScreens/music/listeningParty';
import { theMusicPlayer } from '@ValenceScreens/music/theMusicPlayer';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { useMusicSession } from '@ValenceScreens/music/useMusicSession';
import { useWhatIsPlaying } from '@ValenceScreens/music/useWhatIsPlaying';
import { describeAudioQuality } from '@ValenceScreens/music/describeAudioQuality';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import type { MusicPanel } from '@ValenceScreens/music/musicPanel';
import type { Variants } from 'motion/react';
import type { NowPlayingBarProps } from './NowPlayingBar.types';
import { BarButton } from './components/BarButton/BarButton';

const ARRIVING: Variants = {
  hidden: { opacity: 0, y: '120%' },
  shown: { opacity: 1, y: 0 },
  gone: { opacity: 0, y: '120%' },
};

const ROOM: Variants = {
  hidden: { height: 0 },
  shown: { height: '5rem' },
  gone: { height: 0 },
};

const POPPING: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  shown: { opacity: 1, scale: 1 },
  gone: { opacity: 0, scale: 0.5 },
};

const REPEAT_LABELS = {
  off: 'Repeat everything',
  all: 'Repeat this song',
  one: 'Stop repeating',
} as const;

/**
 * The bar along the bottom of every page while there is music: what is playing, the buttons that
 * drive it, how far through it is, and the way to its lyrics, the queue and the other devices it
 * could be playing on.
 *
 * It stays put across every section, because the music does. It rises into place when the music
 * starts and sinks away when it stops, a new song rises in where the last one was, and its controls
 * move the way the dock's do. While this device is controlling
 * another, everything here drives that one instead, and a band along the foot says which — the
 * one thing it would be alarming not to know when pressing pause does nothing to the speakers in
 * front of you. Shuffle and repeat are there but switched off for a queue whose order means
 * something.
 *
 * In somebody else's listening party the song and where it has got to are the host's, so skipping,
 * pausing and moving through the song are handed to them — unless they have let everybody — while
 * the volume stays with whoever is listening. A listener whose browser would not start the music
 * on its own can still press play to join in.
 *
 * @param player - The player to drive, which is the window's own unless a test says otherwise.
 */
const NowPlayingBar = ({ player: given }: NowPlayingBarProps) => {
  const { state, player } = useMusicPlayer(given ?? theMusicPlayer());
  const shown = useWhatIsPlaying(state);
  const { view, open } = useMusicNavigation();
  const { place, go } = usePlace();
  const panel = useMusicPanel();
  const favourites = useFavourites(useWatchingProfile());
  const listening = useListeningParty();
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const arriving = revealTransition(prefersReducedMotion, 'heavy');

  useMusicSession(state, player);

  if (shown === null) {
    return <AnimatePresence>{null}</AnimatePresence>;
  }

  const { queue } = state;
  const isFollowing = listening !== null && !listening.mayChoose;
  const mayJoinIn = isFollowing && !shown.isPlaying && listening.party.isPlaying;
  const mayPlayPause = !isFollowing || listening.mayPlayPause || mayJoinIn;
  const maySeek = !isFollowing || listening.maySeek;
  const isOrdered = queue?.isOrdered === true;
  const repeat = queue?.repeat ?? 'off';
  const isLiked = favourites.isKept(shown.trackId);
  const volume = state.isMuted ? 0 : shown.volume;

  const togglePanel = (wanted: Exclude<MusicPanel, null>) => {
    const isOpen = panel === wanted && place.section === 'music';

    setMusicPanel(isOpen ? null : wanted);

    if (!isOpen && place.section !== 'music') {
      go({ section: 'music' });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="room"
        aria-hidden
        variants={ROOM}
        initial="hidden"
        animate="shown"
        exit="gone"
        transition={arriving}
        className="shrink-0"
      />
      <motion.div
        key="bar"
        variants={isStill ? fadeVariants : ARRIVING}
        initial="hidden"
        animate="shown"
        exit="gone"
        transition={arriving}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:px-3"
      >
        <GlassPanel
          as="section"
          aria-label="Now playing"
          elevation="film"
          className="pointer-events-auto mx-auto flex max-w-[120rem] flex-col overflow-hidden"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 items-center gap-3">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={shown.trackId}
                  variants={revealItemVariants(prefersReducedMotion)}
                  custom={0}
                  initial="hidden"
                  animate="shown"
                  exit="gone"
                  className="flex min-w-0 items-center gap-3"
                >
                  <Button
                    variant="bare"
                    size="none"
                    label={`Go to ${shown.albumTitle ?? 'the album'}`}
                    hasTooltip={false}
                    className="shrink-0"
                    onClick={() => {
                      open({ kind: 'album', id: shown.albumId });
                    }}
                  >
                    <MusicArtwork
                      src={shown.hasArtwork ? albumArtworkUrl(shown.albumId) : null}
                      label={shown.albumTitle ?? shown.title}
                      className="size-12 sm:size-14"
                    />
                  </Button>

                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[0.9375rem] font-semibold text-text">
                      {shown.title}
                    </span>
                    <span className="flex min-w-0 gap-1 truncate text-[0.8125rem] text-text-muted">
                      {shown.artists.map((artist, at) => {
                        const { id } = artist;

                        return (
                          <span key={`${artist.name}-${at.toString()}`} className="truncate">
                            {id === null ? (
                              artist.name
                            ) : (
                              <Button
                                variant="link"
                                size="none"
                                hasTooltip={false}
                                className="text-text-muted hover:text-text"
                                onClick={() => {
                                  open({ kind: 'artist', id });
                                }}
                              >
                                {artist.name}
                              </Button>
                            )}
                            {at < shown.artists.length - 1 ? ',' : ''}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>

              <BarButton
                label={isLiked ? `Unlike ${shown.title}` : `Like ${shown.title}`}
                glyph={FavouriteIcon}
                gesture="fill"
                isLit={isLiked}
                className="hidden shrink-0 sm:inline-flex"
                onClick={() => {
                  favourites.toggle(shown.trackId);
                }}
              />
            </div>

            <div className="flex min-w-0 flex-col items-center gap-1">
              <div className="flex items-center gap-1 sm:gap-2">
                <BarButton
                  label={queue?.isShuffled === true ? 'Stop shuffling' : 'Shuffle'}
                  glyph={ShuffleIcon}
                  gesture="tumble"
                  isLit={queue?.isShuffled === true}
                  isDisabled={isOrdered || shown.remote !== null || isFollowing}
                  className="hidden md:inline-flex"
                  onClick={() => {
                    player.toggleShuffle();
                  }}
                />

                <BarButton
                  label="Previous"
                  glyph={PreviousIcon}
                  iconSize={20}
                  isSolid
                  isDisabled={isFollowing}
                  onClick={() => {
                    player.previous();
                  }}
                />

                <Button
                  variant="glossy"
                  size="md"
                  isIconOnly
                  label={shown.isPlaying ? 'Pause' : 'Play'}
                  className="relative size-10"
                  disabled={!mayPlayPause}
                  onClick={() => {
                    if (isFollowing && !mayJoinIn) {
                      listening.send({
                        kind: shown.isPlaying ? 'pause' : 'play',
                        atSeconds: shown.positionSeconds,
                      });

                      return;
                    }

                    if (shown.isPlaying) {
                      player.pause();
                    } else {
                      player.resume();
                    }
                  }}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={
                        shown.isLoading && shown.isPlaying
                          ? 'loading'
                          : shown.isPlaying
                            ? 'pause'
                            : 'play'
                      }
                      variants={isStill ? fadeVariants : POPPING}
                      initial="hidden"
                      animate="shown"
                      exit="gone"
                      transition={isStill ? stillTransition : spring}
                      className="flex"
                    >
                      {shown.isLoading && shown.isPlaying ? (
                        <Spinner size="sm" label="Loading" />
                      ) : (
                        <Icon of={shown.isPlaying ? PauseIcon : PlayIcon} size={20} isActive />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </Button>

                <BarButton
                  label="Next"
                  glyph={NextIcon}
                  iconSize={20}
                  isSolid
                  isDisabled={isFollowing}
                  onClick={() => {
                    player.next();
                  }}
                />

                <BarButton
                  label={REPEAT_LABELS[repeat]}
                  glyph={repeat === 'one' ? RepeatOne01Icon : RepeatIcon}
                  gesture="spin"
                  isLit={repeat !== 'off'}
                  isDisabled={isOrdered || shown.remote !== null || isFollowing}
                  className="hidden md:inline-flex"
                  onClick={() => {
                    player.cycleRepeat();
                  }}
                />
              </div>

              <div className="hidden w-full items-center gap-2 md:flex">
                <span className="w-10 text-right text-xs tabular-nums text-text-muted">
                  {formatDuration(shown.positionSeconds)}
                </span>
                <Slider
                  label="Where the song is"
                  tone="glass"
                  value={Math.min(shown.positionSeconds, shown.durationSeconds)}
                  max={Math.max(shown.durationSeconds, 1)}
                  step={1}
                  valueLabel={(value) => formatDuration(value)}
                  isDisabled={!maySeek}
                  className="min-w-0 flex-1"
                  onValueChange={(value) => {
                    if (isFollowing) {
                      listening.send({ kind: 'seek', atSeconds: value });

                      return;
                    }

                    player.seek(value);
                  }}
                />
                <span className="w-10 text-xs tabular-nums text-text-muted">
                  {formatDuration(shown.durationSeconds)}
                </span>
              </div>
            </div>

            <div className="hidden min-w-0 items-center justify-end gap-1 md:flex">
              <BarButton
                label="Lyrics"
                glyph={Mic01Icon}
                gesture="ring"
                isLit={view.kind === 'lyrics' && place.section === 'music'}
                onClick={() => {
                  open(
                    view.kind === 'lyrics' && place.section === 'music'
                      ? { kind: 'album', id: shown.albumId }
                      : { kind: 'lyrics' },
                  );
                }}
              />

              <BarButton
                label="Queue"
                glyph={LeftToRightListNumberIcon}
                isLit={panel === 'queue'}
                onClick={() => {
                  togglePanel('queue');
                }}
              />

              <BarButton
                label="Listening party"
                glyph={UserGroupIcon}
                isLit={panel === 'party' || listening !== null}
                onClick={() => {
                  togglePanel('party');
                }}
              />

              <BarButton
                label="Play on another device"
                glyph={LaptopIcon}
                isLit={panel === 'devices' || shown.remote !== null}
                onClick={() => {
                  togglePanel('devices');
                }}
              />

              <OptionMenu
                label="Streaming quality"
                align="end"
                triggerShape="field"
                className="w-auto shrink-0"
                trigger={
                  <span className="rounded-xs px-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide">
                    {AUDIO_QUALITY_LABELS[state.playingQuality ?? state.quality]}
                  </span>
                }
                groups={[
                  {
                    name: 'Quality',
                    selectedId: state.quality,
                    onSelect: (id) => {
                      const chosen = AudioQualitySchema.safeParse(id);

                      if (chosen.success) {
                        player.setQuality(chosen.data);
                      }
                    },
                    options: AUDIO_QUALITIES.map((quality) => ({
                      id: quality,
                      label: AUDIO_QUALITY_LABELS[quality],
                      detail: describeAudioQuality(quality, state.current?.bitrateKbps ?? null),
                    })),
                  },
                ]}
              />

              <BarButton
                label={state.isMuted ? 'Unmute' : 'Mute'}
                glyph={
                  volume === 0 ? VolumeMute01Icon : volume < 0.5 ? VolumeLowIcon : VolumeHighIcon
                }
                gesture="ring"
                onClick={() => {
                  player.toggleMute();
                }}
              />

              <Slider
                label="Volume"
                tone="glass"
                value={Math.round(volume * 100)}
                max={100}
                step={1}
                valueLabel={(value) => `${value.toString()}%`}
                className="w-24 shrink-0 lg:w-28"
                onValueChange={(value) => {
                  player.setVolume(value / 100);
                }}
              />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {listening === null ? null : (
              <motion.div
                key="party"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={isStill ? stillTransition : spring}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-end gap-2 bg-on-scrim px-4 py-1 text-xs font-semibold text-shade">
                  <Icon of={UserGroupIcon} size={14} />
                  {isFollowing
                    ? `Listening along with ${listening.hostName}`
                    : `Hosting a listening party · ${listening.party.members.length.toString()} here`}
                </div>
              </motion.div>
            )}
            {shown.remote === null ? null : (
              <motion.div
                key="remote"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={isStill ? stillTransition : spring}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-end gap-2 bg-on-scrim px-4 py-1 text-xs font-semibold text-shade">
                  <Icon of={LaptopIcon} size={14} />
                  Playing on {shown.remote.label}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>
      </motion.div>
    </AnimatePresence>
  );
};

NowPlayingBar.displayName = 'NowPlayingBar';

export { NowPlayingBar };
