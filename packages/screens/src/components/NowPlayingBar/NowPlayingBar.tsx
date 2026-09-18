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
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute01Icon,
} from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { GlassPanel } from '@ValenceUI/GlassPanel';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { Slider } from '@ValenceUI/Slider';
import { Spinner } from '@ValenceUI/Spinner';
import { cn } from '@ValenceUI/cn';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import {
  AUDIO_QUALITIES,
  AUDIO_QUALITY_DETAILS,
  AUDIO_QUALITY_LABELS,
  AudioQualitySchema,
} from '@ValenceContracts/schemas/Music';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { setMusicPanel, useMusicPanel } from '@ValenceScreens/music/musicPanel';
import { theMusicPlayer } from '@ValenceScreens/music/theMusicPlayer';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { useMusicSession } from '@ValenceScreens/music/useMusicSession';
import { useWhatIsPlaying } from '@ValenceScreens/music/useWhatIsPlaying';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import type { MusicPanel } from '@ValenceScreens/music/musicPanel';
import type { NowPlayingBarProps } from './NowPlayingBar.types';

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
 * It stays put across every section, because the music does. While this device is controlling
 * another, everything here drives that one instead, and a band along the foot says which — the
 * one thing it would be alarming not to know when pressing pause does nothing to the speakers in
 * front of you. Shuffle and repeat are there but switched off for a queue whose order means
 * something.
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

  useMusicSession(state, player);

  if (shown === null) {
    return null;
  }

  const { queue } = state;
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
    <>
      <div aria-hidden className="h-20 shrink-0" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:px-3">
        <GlassPanel
          as="section"
          aria-label="Now playing"
          className="pointer-events-auto mx-auto flex max-w-[120rem] flex-col overflow-hidden rounded-2xl"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 items-center gap-3">
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

              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                isActive={isLiked}
                label={isLiked ? `Unlike ${shown.title}` : `Like ${shown.title}`}
                className={cn('hidden shrink-0 sm:inline-flex', isLiked ? 'text-accent' : '')}
                onClick={() => {
                  favourites.toggle(shown.trackId);
                }}
              >
                <Icon of={FavouriteIcon} size={18} isActive={isLiked} />
              </Button>
            </div>

            <div className="flex min-w-0 flex-col items-center gap-1">
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  isActive={queue?.isShuffled === true}
                  disabled={isOrdered || shown.remote !== null}
                  label={queue?.isShuffled === true ? 'Stop shuffling' : 'Shuffle'}
                  className={cn(
                    'hidden md:inline-flex',
                    queue?.isShuffled === true ? 'text-accent' : '',
                  )}
                  onClick={() => {
                    player.toggleShuffle();
                  }}
                >
                  <Icon of={ShuffleIcon} size={18} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  label="Previous"
                  onClick={() => {
                    player.previous();
                  }}
                >
                  <Icon of={PreviousIcon} size={20} isActive />
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  isIconOnly
                  isPill
                  label={shown.isPlaying ? 'Pause' : 'Play'}
                  className="size-10"
                  onClick={() => {
                    player.toggle();
                  }}
                >
                  {shown.isLoading && shown.isPlaying ? (
                    <Spinner size="sm" label="Loading" />
                  ) : (
                    <Icon of={shown.isPlaying ? PauseIcon : PlayIcon} size={20} isActive />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  label="Next"
                  onClick={() => {
                    player.next();
                  }}
                >
                  <Icon of={NextIcon} size={20} isActive />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  isActive={repeat !== 'off'}
                  disabled={isOrdered || shown.remote !== null}
                  label={REPEAT_LABELS[repeat]}
                  className={cn('hidden md:inline-flex', repeat === 'off' ? '' : 'text-accent')}
                  onClick={() => {
                    player.cycleRepeat();
                  }}
                >
                  <Icon of={repeat === 'one' ? RepeatOne01Icon : RepeatIcon} size={18} />
                </Button>
              </div>

              <div className="hidden w-full items-center gap-2 md:flex">
                <span className="w-10 text-right text-xs tabular-nums text-text-muted">
                  {formatDuration(shown.positionSeconds)}
                </span>
                <Slider
                  label="Where the song is"
                  value={Math.min(shown.positionSeconds, shown.durationSeconds)}
                  max={Math.max(shown.durationSeconds, 1)}
                  step={1}
                  valueLabel={(value) => formatDuration(value)}
                  className="flex-1"
                  onValueChange={(value) => {
                    player.seek(value);
                  }}
                />
                <span className="w-10 text-xs tabular-nums text-text-muted">
                  {formatDuration(shown.durationSeconds)}
                </span>
              </div>
            </div>

            <div className="hidden min-w-0 items-center justify-end gap-1 md:flex">
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                isActive={view.kind === 'lyrics' && place.section === 'music'}
                label="Lyrics"
                className={view.kind === 'lyrics' && place.section === 'music' ? 'text-accent' : ''}
                onClick={() => {
                  open(
                    view.kind === 'lyrics' && place.section === 'music'
                      ? { kind: 'album', id: shown.albumId }
                      : { kind: 'lyrics' },
                  );
                }}
              >
                <Icon of={Mic01Icon} size={18} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                isActive={panel === 'queue'}
                label="Queue"
                className={panel === 'queue' ? 'text-accent' : ''}
                onClick={() => {
                  togglePanel('queue');
                }}
              >
                <Icon of={LeftToRightListNumberIcon} size={18} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                isActive={panel === 'devices' || shown.remote !== null}
                label="Play on another device"
                className={panel === 'devices' || shown.remote !== null ? 'text-accent' : ''}
                onClick={() => {
                  togglePanel('devices');
                }}
              >
                <Icon of={LaptopIcon} size={18} />
              </Button>

              <OptionMenu
                label="Streaming quality"
                align="end"
                triggerShape="field"
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
                      detail: AUDIO_QUALITY_DETAILS[quality],
                    })),
                  },
                ]}
              />

              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                label={state.isMuted ? 'Unmute' : 'Mute'}
                onClick={() => {
                  player.toggleMute();
                }}
              >
                <Icon
                  of={
                    volume === 0 ? VolumeMute01Icon : volume < 0.5 ? VolumeLowIcon : VolumeHighIcon
                  }
                  size={18}
                />
              </Button>

              <Slider
                label="Volume"
                value={Math.round(volume * 100)}
                max={100}
                step={1}
                valueLabel={(value) => `${value.toString()}%`}
                className="w-24 lg:w-28"
                onValueChange={(value) => {
                  player.setVolume(value / 100);
                }}
              />
            </div>
          </div>

          {shown.remote === null ? null : (
            <div className="flex items-center justify-end gap-2 bg-accent px-4 py-1 text-xs font-semibold text-accent-contrast">
              <Icon of={LaptopIcon} size={14} />
              Playing on {shown.remote.label}
            </div>
          )}
        </GlassPanel>
      </div>
    </>
  );
};

NowPlayingBar.displayName = 'NowPlayingBar';

export { NowPlayingBar };
