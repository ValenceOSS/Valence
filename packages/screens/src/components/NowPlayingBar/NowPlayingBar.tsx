import {
  FavouriteIcon,
  LaptopIcon,
  LeftToRightListNumberIcon,
  MoreHorizontalIcon,
  Mic01Icon,
  UserGroupIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute01Icon,
} from '@hugeicons/core-free-icons';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { Slider } from '@ValenceUI/Slider';
import {
  fadeVariants,
  revealItemVariants,
  revealTransition,
  spring,
  stillTransition,
} from '@ValenceUI/animations/reveal';
import { AUDIO_QUALITIES, AudioQualitySchema } from '@ValenceContracts/schemas/Music';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { setMusicImmersive, useMusicImmersive } from '@ValenceScreens/music/musicImmersive';
import { keepBarRoom } from '@ValenceScreens/music/keepBarRoom';
import { setMusicPanel, useMusicPanel } from '@ValenceScreens/music/musicPanel';
import { useListeningParty } from '@ValenceScreens/music/listeningParty';
import { theMusicPlayer } from '@ValenceScreens/music/theMusicPlayer';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { useMusicSession } from '@ValenceScreens/music/useMusicSession';
import { idleWhatIsPlaying } from '@ValenceScreens/music/idleWhatIsPlaying';
import { useWhatIsPlaying } from '@ValenceScreens/music/useWhatIsPlaying';
import { describeAudioQuality } from '@ValenceScreens/music/describeAudioQuality';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import type { MusicPanel } from '@ValenceScreens/music/musicPanel';
import type { Variants } from 'motion/react';
import type { NowPlayingBarProps } from './NowPlayingBar.types';
import { BarButton } from '@ValenceScreens/components/BarButton/BarButton';
import { MusicTransport } from '@ValenceScreens/components/MusicTransport/MusicTransport';

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

/**
 * The bar along the bottom of every page while there is music: what is playing, the buttons that
 * drive it, how far through it is, and the way to its lyrics, the queue and the other devices it
 * could be playing on.
 *
 * It stays put across every section, because the music does. It rises into place when the music
 * starts and sinks away when it stops, a new song rises in where the last one was, and its controls
 * move the way the dock's do. It steps aside while the immersive view is open, which carries
 * controls of its own. While this device is controlling
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
  const { state, player } = useMusicPlayer(given ?? theMusicPlayer(), { followsPosition: true });
  const playing = useWhatIsPlaying(state);
  const { view, open } = useMusicNavigation();
  const { place, go } = usePlace();
  const panel = useMusicPanel();
  const favourites = useFavourites(useWatchingProfile());
  const listening = useListeningParty();
  const isImmersive = useMusicImmersive();
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const arriving = revealTransition(prefersReducedMotion, 'heavy');

  useMusicSession(state, player);

  const isIdle = playing === null;

  if (isImmersive || (isIdle && place.section !== 'music')) {
    return <AnimatePresence>{null}</AnimatePresence>;
  }

  const shown = playing ?? idleWhatIsPlaying(state.volume);

  const isFollowing = listening !== null && !listening.mayChoose;
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
        ref={(bar: HTMLDivElement | null) => (bar === null ? undefined : keepBarRoom(bar))}
        variants={isStill ? fadeVariants : ARRIVING}
        initial="hidden"
        animate="shown"
        exit="gone"
        transition={arriving}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:px-3"
      >
        <section
          aria-label="Now playing"
          className="valence-card-shell pointer-events-auto mx-auto max-w-[120rem] text-text"
        >
          <div className="valence-card-face valence-card-face--raised flex flex-col overflow-hidden">
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
                      label="Open the immersive view"
                      hasTooltip={false}
                      disabled={isIdle}
                      className="shrink-0"
                      onClick={() => {
                        setMusicImmersive(true);
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
                                  variant="subtle"
                                  size="none"
                                  hasTooltip={false}
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
                  isDisabled={isIdle}
                  className="hidden shrink-0 sm:inline-flex"
                  onClick={() => {
                    favourites.toggle(shown.trackId);
                  }}
                />
              </div>

              <ActionMenu
                label="More music controls"
                className="md:hidden"
                trigger={<Icon of={MoreHorizontalIcon} size={20} />}
                groups={[
                  {
                    items: [
                      {
                        id: 'lyrics',
                        label: 'Lyrics',
                        icon: <Icon of={Mic01Icon} size={16} />,
                        isDisabled: isIdle,
                        onChoose: () => {
                          open(
                            view.kind === 'lyrics' && place.section === 'music'
                              ? { kind: 'album', id: shown.albumId }
                              : { kind: 'lyrics' },
                          );
                        },
                      },
                      {
                        id: 'queue',
                        label: 'Queue',
                        icon: <Icon of={LeftToRightListNumberIcon} size={16} />,
                        onChoose: () => {
                          togglePanel('queue');
                        },
                      },
                      {
                        id: 'party',
                        label: 'Listening party',
                        icon: <Icon of={UserGroupIcon} size={16} />,
                        onChoose: () => {
                          togglePanel('party');
                        },
                      },
                      {
                        id: 'devices',
                        label: 'Play on another device',
                        icon: <Icon of={LaptopIcon} size={16} />,
                        onChoose: () => {
                          togglePanel('devices');
                        },
                      },
                      {
                        id: 'mute',
                        label: state.isMuted ? 'Unmute' : 'Mute',
                        icon: (
                          <Icon of={volume === 0 ? VolumeMute01Icon : VolumeHighIcon} size={16} />
                        ),
                        keepsOpen: true,
                        onChoose: () => {
                          player.toggleMute();
                        },
                      },
                    ],
                  },
                ]}
              />

              <div className="col-span-2 md:col-span-1">
                <MusicTransport state={state} shown={shown} player={player} isIdle={isIdle} />
              </div>

              <div className="hidden min-w-0 items-center justify-end gap-1 md:flex">
                <BarButton
                  label="Lyrics"
                  glyph={Mic01Icon}
                  gesture="ring"
                  isLit={view.kind === 'lyrics' && place.section === 'music'}
                  isDisabled={isIdle}
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
                      {
                        describeAudioQuality(state.playingQuality ?? state.quality, state.current)
                          .label
                      }
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
                        ...describeAudioQuality(quality, state.current),
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
          </div>
        </section>
      </motion.div>
    </AnimatePresence>
  );
};

NowPlayingBar.displayName = 'NowPlayingBar';

export { NowPlayingBar };
