import { Icon } from '@ValenceUI/Icon';
import {
  Cast as CastIcon,
  CircleActivity as CircleActivityIcon,
  Clock as ClockIcon,
  Gauge as GaugeIcon,
  Headphones as HeadphonesIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  Minus as MinusIcon,
  Monitor as MonitorIcon,
  PictureInPicture as PictureInPictureIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshCwIcon,
  RotateCcw as RotateCcwIcon,
  RotateCw as RotateCwIcon,
  Settings as SettingsIcon,
  SkipForward as SkipForwardIcon,
  Subtitles as SubtitlesIcon,
  TypeOutline as TypeOutlineIcon,
  Volume as VolumeIcon,
  VolumeOff as VolumeOffIcon,
} from '@keyline-icons/react';
import {
  Cast as CastFilledIcon,
  Monitor as MonitorFilledIcon,
  Pause as PauseFilledIcon,
  PictureInPicture as PictureInPictureFilledIcon,
  Play as PlayFilledIcon,
  Subtitles as SubtitlesFilledIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Slider } from '@ValenceUI/Slider';
import { SettingsMenu } from '@ValenceUI/SettingsMenu';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { nextEpisode } from '@ValenceClient/library/pickFeatured';
import { SUBTITLES_OFF } from '@ValenceClient/playback/fetchSubtitles';
import { qualityStepDetail } from '@ValenceClient/playback/qualityStepDetail';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { CaptionSettings } from '@ValenceScreens/components/VideoPlayer/components/CaptionSettings/CaptionSettings';
import { EpisodeMenu } from '@ValenceScreens/components/VideoPlayer/components/EpisodeMenu/EpisodeMenu';
import { SKIP_SECONDS, BOOST_STEPS } from './PlayerControls.types';
import { PLAYBACK_RATES } from '@ValenceClient/playback/PLAYBACK_RATES';
import { SUBTITLE_STEP_SECONDS } from '@ValenceClient/playback/SUBTITLE_STEP_SECONDS';
import { describePlaybackRate } from '@ValenceClient/playback/describePlaybackRate';
import { describeSubtitleOffset } from '@ValenceClient/playback/describeSubtitleOffset';
import type { PlayerControlsProps } from './PlayerControls.types';
import { say } from '@ValenceI18n/say';

/**
 * Formats a playback rate the way a viewer reads it rather than the way a float prints, so the menu
 * offers "1.5x" and not "1.5000000000000002x".
 *
 * @param rate - The rate.
 * @returns What the menu shows.
 */
const rateLabel = (rate: number): string => `${rate.toString()}x`;

/**
 * The bar over the bottom of the video, and everything reachable from it: the scrubber and its
 * preview, play, skip and volume, and the menus for subtitles, audio, quality, speed, caption
 * appearance and the rest of the season. Holds no state about the viewing itself — every control
 * reports what was pressed and is told afterwards what happened, so that the player remains the one
 * place that knows what is going on.
 *
 * @param title - What is playing.
 * @param isPlaying - Whether it is playing at the moment.
 * @param position - Where the viewer is.
 * @param duration - How long it runs.
 * @param volume - How loud it is.
 * @param isMuted - Whether it is silenced.
 * @param isFullscreen - Whether the player fills the screen.
 * @param isGlowing - Whether the picture sits within a glow of its own colours, rather than filling the page.
 * @param onToggleGlow - Called to go into or out of that view, where this player offers it.
 * @param isShowingStats - Whether the statistics panel is open.
 * @param playbackRate - How fast it is playing.
 * @param subtitleTracks - The subtitle tracks available.
 * @param selectedSubtitleId - The subtitle track in use, if any.
 * @param audioTracks - The audio tracks available.
 * @param selectedAudioIndex - The audio track in use, if the player has settled on one.
 * @param availableQualitySteps - The rungs of the ladder this session offers.
 * @param originalLabel - What the file as it is on the server is called, with its resolution.
 * @param qualityStepsSavingNothing - Smaller qualities that would cost about what the original does,
 *   shown but not offered.
 * @param qualityStepCosts - What each rung would actually cost, where the session has worked it out.
 * @param selectedQuality - Whether quality is being chosen automatically or pinned to a rung.
 * @param isDisabled - Whether the controls are inert, as they are while a session is starting.
 * @param onTogglePlay - Called to play or pause.
 * @param onSeek - Called with where the viewer scrubbed to.
 * @param onSkip - Called with how far to jump, forwards or back.
 * @param onPlaybackRateChange - Called with the speed they chose.
 * @param onSubtitleChange - Called with the subtitle track they chose.
 * @param onAudioChange - Called with the audio track they chose.
 * @param onQualityChange - Called with the quality they chose.
 * @param episodes - The rest of the season, where there is one.
 * @param playingId - Which of those episodes is on now, which also decides the next one offered.
 * @param following - The episode offered next, where the caller knows better than the season does,
 *   as it does at a season's end; worked out from the season where not given.
 * @param onSelectEpisode - Called with an episode they chose to play instead.
 * @param watchedFractionFor - How to ask how far through a given episode they are.
 * @param onMenuOpenChange - Called as a menu opens or closes, so the bar is not hidden beneath one.
 * @param isShowingRemaining - Whether the clock counts down to the end or up from the start.
 * @param onToggleTimeDisplay - Called to swap between those two.
 * @param captionStyle - How captions are drawn.
 * @param onCaptionStyleChange - Called with a change to that.
 * @param onCaptionStyleReset - Called to put caption appearance back to its defaults.
 * @param onVolumeChange - Called with the volume they set.
 * @param onToggleMute - Called to silence or unsilence.
 * @param onToggleFullscreen - Called to enter or leave fullscreen.
 * @param onToggleStats - Called to open or close the statistics panel.
 * @param subtitleOffsetSeconds - How far subtitles are nudged from where the file puts them.
 * @param onSubtitleOffsetChange - Called with a nudge to that.
 * @param castState - Whether there is anywhere to cast to, and whether it is in use.
 * @param onCast - Called to cast to another device.
 * @param onPlayOnTv - Called to send the film to one of this person's televisions, where one is open.
 * @param onPopOut - Called to move the video into a floating window.
 * @param isPoppedOut - Whether it is already in one.
 * @param partyMenu - The watch party control, where this viewing can be one.
 * @param renderPreview - How to draw the frame under the pointer while scrubbing.
 */
const PlayerControls = ({
  title,
  isPlaying,
  position,
  duration,
  volume,
  boost,
  isMuted,
  isFullscreen,
  isGlowing = false,
  onToggleGlow,
  isShowingStats,
  playbackRate,
  subtitleTracks,
  selectedSubtitleId,
  audioTracks,
  selectedAudioIndex,
  availableQualitySteps,
  originalLabel = say('common.original'),
  qualityStepsSavingNothing = [],
  qualityStepCosts = {},
  selectedQuality,
  isDisabled = false,
  onTogglePlay,
  onSeek,
  onSkip,
  onPlaybackRateChange,
  onSubtitleChange,
  onAudioChange,
  onQualityChange,
  playingId,
  episodes = [],
  following: givenFollowing,
  onSelectEpisode,
  watchedFractionFor,
  onMenuOpenChange,
  isShowingRemaining,
  onToggleTimeDisplay,
  captionStyle,
  onCaptionStyleChange,
  onCaptionStyleReset,
  onVolumeChange,
  onBoostChange,
  onToggleMute,
  onToggleFullscreen,
  onPopOut,
  isPoppedOut = false,
  castState = 'unavailable',
  onCast,
  onPlayOnTv,
  onToggleStats,
  subtitleOffsetSeconds = 0,
  onSubtitleOffsetChange,
  renderPreview,
  partyMenu,
}: PlayerControlsProps) => {
  const playing = episodes.find((episode) => episode.id === playingId);
  const following =
    givenFollowing !== undefined
      ? givenFollowing
      : playing === undefined
        ? null
        : nextEpisode(episodes, playing);

  return (
    <div className="valence-solid flex flex-col gap-1 rounded-lg px-3 py-2 text-text sm:px-4">
      <div className="flex items-center gap-3">
        <Slider
          label={say('common.moveThroughTitle', { title })}
          value={position}
          max={duration}
          onValueChange={onSeek}
          tone="glass"
          className="min-w-0 flex-1"
          {...(renderPreview === undefined ? {} : { renderPreview })}
        />

        <Button
          variant="ghost"
          size="none"
          aria-label={
            isShowingRemaining
              ? say('screens.videoPlayer.playerControls.showTheTimePlayed')
              : say('screens.videoPlayer.playerControls.showTheTimeRemaining')
          }
          onClick={onToggleTimeDisplay}
          className="shrink-0 px-1 text-xs tabular-nums sm:text-sm"
        >
          {isShowingRemaining
            ? `-${formatDuration(Math.max(duration - position, 0))}`
            : formatDuration(position)}{' '}
          <span className="text-text-muted">/ {formatDuration(duration)}</span>
        </Button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          isIconOnly
          variant="ghost"
          label={say('screens.videoPlayer.playerControls.backSKIPSECONDSSeconds', {
            SKIP_SECONDS: SKIP_SECONDS.toString(),
          })}
          onClick={() => {
            onSkip(-SKIP_SECONDS);
          }}
          disabled={isDisabled}
          size="md"
        >
          <Icon of={RotateCcwIcon} size={22} />
        </Button>

        <Button
          isIconOnly
          variant="ghost"
          label={isPlaying ? say('common.pause') : say('common.play')}
          onClick={onTogglePlay}
          disabled={isDisabled}
          size="md"
        >
          {isPlaying ? (
            <Icon of={PauseFilledIcon} size={22} />
          ) : (
            <Icon of={PlayFilledIcon} size={22} />
          )}
        </Button>

        <Button
          isIconOnly
          variant="ghost"
          label={say('screens.videoPlayer.playerControls.forwardSKIPSECONDSSeconds', {
            SKIP_SECONDS: SKIP_SECONDS.toString(),
          })}
          onClick={() => {
            onSkip(SKIP_SECONDS);
          }}
          disabled={isDisabled}
          size="md"
        >
          <Icon of={RotateCwIcon} size={22} />
        </Button>

        {following === null || onSelectEpisode === undefined ? null : (
          <Button
            isIconOnly
            variant="ghost"
            label={
              following.episodeNumber === null || following.episodeNumber === undefined
                ? say('screens.videoPlayer.playerControls.nextEpisodeTitle', {
                    title: following.title,
                  })
                : say('screens.videoPlayer.playerControls.nextEpisodeNumberTitle', {
                    number: describeEpisodeNumbers(
                      following.episodeNumber,
                      following.episodeNumberEnd,
                    ),
                    title: following.title,
                  })
            }
            onClick={() => {
              onSelectEpisode(following);
            }}
            disabled={isDisabled}
            size="md"
          >
            <Icon of={SkipForwardIcon} size={22} />
          </Button>
        )}

        <span className="flex-1" />

        <div className="group/volume hidden items-center gap-1 sm:flex">
          <Button
            isIconOnly
            variant="ghost"
            label={isMuted ? say('common.unmute') : say('common.mute')}
            onClick={onToggleMute}
            size="md"
          >
            {isMuted || volume === 0 ? (
              <Icon of={VolumeOffIcon} size={20} />
            ) : (
              <Icon of={VolumeIcon} size={20} />
            )}
          </Button>

          <Slider
            label={say('common.volume')}
            value={isMuted ? 0 : Math.round(volume * 100)}
            max={100}
            tone="glass"
            onValueChange={(next) => {
              onVolumeChange(next / 100);
            }}
            valueLabel={(loudness) => `${Math.round(loudness).toString()}%`}
            className="w-0 overflow-hidden px-0 transition-[width,padding] duration-[var(--duration-fast)] ease-[var(--ease-out)] motion-reduce:transition-none group-hover/volume:w-24 group-hover/volume:px-2 group-focus-within/volume:w-24 group-focus-within/volume:px-2"
          />
        </div>

        {partyMenu}

        {onSelectEpisode === undefined ? null : (
          <EpisodeMenu
            {...(onMenuOpenChange === undefined ? {} : { onOpenChange: onMenuOpenChange })}
            episodes={episodes}
            playingId={playingId}
            onSelect={onSelectEpisode}
            isDisabled={isDisabled}
            {...(watchedFractionFor === undefined ? {} : { watchedFractionFor })}
          />
        )}

        {subtitleTracks.length === 0 ? null : (
          <Button
            isIconOnly
            variant="ghost"
            label={
              selectedSubtitleId === SUBTITLES_OFF
                ? say('screens.videoPlayer.playerControls.turnSubtitlesOn')
                : say('screens.videoPlayer.playerControls.turnSubtitlesOff')
            }
            isActive={selectedSubtitleId !== SUBTITLES_OFF}
            onClick={() => {
              onSubtitleChange(
                selectedSubtitleId === SUBTITLES_OFF
                  ? (subtitleTracks[0]?.id ?? SUBTITLES_OFF)
                  : SUBTITLES_OFF,
              );
            }}
            disabled={isDisabled}
            size="md"
          >
            <Icon
              of={SubtitlesIcon}
              whenActive={SubtitlesFilledIcon}
              isActive={selectedSubtitleId !== SUBTITLES_OFF}
              size={20}
            />
          </Button>
        )}

        <SettingsMenu
          label={say('common.settings')}
          tone="default"
          {...(onMenuOpenChange === undefined ? {} : { onOpenChange: onMenuOpenChange })}
          isDisabled={isDisabled}
          trigger={<Icon of={SettingsIcon} size={20} />}
          triggerWhenOpen={<Icon of={SettingsIcon} size={20} />}
          rows={[
            ...(audioTracks.length < 2
              ? []
              : [
                  {
                    kind: 'choice' as const,
                    id: 'audio',
                    label: say('screens.videoPlayer.playerControls.audioTrack'),
                    icon: <Icon of={HeadphonesIcon} size={18} />,
                    selectedId: (selectedAudioIndex ?? audioTracks[0]?.index ?? 0).toString(),
                    onSelect: (id: string) => {
                      onAudioChange(Number(id));
                    },
                    choices: audioTracks.map((track) => ({
                      id: track.index.toString(),
                      label: track.label,
                    })),
                  },
                ]),
            ...(subtitleTracks.length === 0
              ? []
              : [
                  {
                    kind: 'choice' as const,
                    id: 'subtitles',
                    label: 'Subtitles/CC',
                    icon: <Icon of={SubtitlesIcon} size={18} />,
                    selectedId: selectedSubtitleId,
                    onSelect: onSubtitleChange,
                    choices: [
                      { id: SUBTITLES_OFF, label: say('common.off') },
                      ...subtitleTracks.map((track) => ({
                        id: track.id,
                        label: track.label,
                        ...(track.format === '' ? {} : { detail: track.format.toUpperCase() }),
                      })),
                    ],
                  },
                ]),
            ...(selectedSubtitleId === SUBTITLES_OFF || onSubtitleOffsetChange === undefined
              ? []
              : [
                  {
                    kind: 'custom' as const,
                    id: 'timing',
                    label: say('common.subtitleTiming'),
                    icon: <Icon of={ClockIcon} size={18} />,
                    detail: describeSubtitleOffset(subtitleOffsetSeconds),
                    control: (
                      <span className="flex items-center gap-1">
                        <Button
                          isIconOnly
                          variant="ghost"
                          label={say('screens.videoPlayer.playerControls.subtitlesEarlier')}
                          size="sm"
                          onClick={() => {
                            onSubtitleOffsetChange(subtitleOffsetSeconds - SUBTITLE_STEP_SECONDS);
                          }}
                        >
                          <Icon of={MinusIcon} size={16} />
                        </Button>

                        <Button
                          isIconOnly
                          variant="ghost"
                          label={say('screens.videoPlayer.playerControls.subtitlesInTime')}
                          size="sm"
                          onClick={() => {
                            onSubtitleOffsetChange(0);
                          }}
                        >
                          <Icon of={RefreshCwIcon} size={16} />
                        </Button>

                        <Button
                          isIconOnly
                          variant="ghost"
                          label={say('screens.videoPlayer.playerControls.subtitlesLater')}
                          size="sm"
                          onClick={() => {
                            onSubtitleOffsetChange(subtitleOffsetSeconds + SUBTITLE_STEP_SECONDS);
                          }}
                        >
                          <Icon of={PlusIcon} size={16} />
                        </Button>
                      </span>
                    ),
                  },
                ]),
            ...(subtitleTracks.length === 0
              ? []
              : [
                  {
                    kind: 'panel' as const,
                    id: 'appearance',
                    label: say('common.captionSettings'),
                    icon: <Icon of={TypeOutlineIcon} size={18} />,
                    content: (
                      <CaptionSettings
                        style={captionStyle}
                        onChange={onCaptionStyleChange}
                        onReset={onCaptionStyleReset}
                      />
                    ),
                  },
                ]),
            {
              kind: 'choice' as const,
              id: 'speed',
              label: say('screens.videoPlayer.playerControls.playbackSpeed'),
              icon: <Icon of={GaugeIcon} size={18} />,
              selectedId: playbackRate.toString(),
              onSelect: (id: string) => {
                onPlaybackRateChange(Number(id));
              },
              choices: PLAYBACK_RATES.map((rate) => ({
                id: rate.toString(),
                label: describePlaybackRate(rate),
              })),
            },
            {
              kind: 'choice' as const,
              id: 'boost',
              label: say('screens.videoPlayer.playerControls.volumeBoost'),
              icon: <Icon of={VolumeIcon} size={18} />,
              selectedId: boost.toString(),
              onSelect: (id: string) => {
                onBoostChange(Number(id));
              },
              choices: BOOST_STEPS.map((step) => ({
                id: step.toString(),
                label: step === 1 ? say('common.off') : rateLabel(step),
              })),
            },
            ...(availableQualitySteps.length === 0
              ? []
              : [
                  {
                    kind: 'choice' as const,
                    id: 'quality',
                    label: say('common.quality'),
                    icon: <Icon of={MonitorIcon} size={18} />,
                    selectedId: selectedQuality,
                    onSelect: (id: string) => {
                      onQualityChange(
                        availableQualitySteps.find((step) => step === id) ?? 'original',
                      );
                    },
                    choices: [
                      {
                        id: 'original',
                        label: originalLabel,
                        ...(qualityStepCosts.original === undefined
                          ? {}
                          : { detail: qualityStepCosts.original }),
                      },
                      ...availableQualitySteps.map((id) => {
                        const isNoSmaller = qualityStepsSavingNothing.includes(id);
                        const detail = qualityStepDetail({
                          cost: qualityStepCosts[id],
                          isNoSmaller,
                        });

                        return {
                          id,
                          label: QUALITY_STEPS.find((entry) => entry.id === id)?.label ?? id,
                          ...(detail === undefined ? {} : { detail }),
                          ...(isNoSmaller ? { isDisabled: true } : {}),
                        };
                      }),
                    ],
                  },
                ]),
            {
              kind: 'toggle' as const,
              id: 'stats',
              label: say('common.statsForNerds'),
              icon: <Icon of={CircleActivityIcon} size={18} />,
              isOn: isShowingStats,
              onToggle: onToggleStats,
            },
          ]}
        />

        {onPlayOnTv === undefined ? null : (
          <Button
            isIconOnly
            variant="ghost"
            label={say('common.playOnTV')}
            onClick={onPlayOnTv}
            size="md"
          >
            <Icon of={MonitorIcon} size={20} />
          </Button>
        )}

        {onCast === undefined || castState === 'unavailable' ? null : (
          <Button
            isIconOnly
            variant="ghost"
            label={
              castState === 'connected'
                ? say('common.playingOnAnotherDevice')
                : say('screens.videoPlayer.playerControls.playOnADeviceYourBrowser')
            }
            isActive={castState === 'connected'}
            disabled={castState === 'connecting'}
            onClick={onCast}
            size="md"
          >
            <Icon
              of={CastIcon}
              whenActive={CastFilledIcon}
              isActive={castState === 'connected'}
              size={20}
            />
          </Button>
        )}

        {onPopOut === undefined ? null : (
          <Button
            isIconOnly
            variant="ghost"
            label={say('screens.videoPlayer.playerControls.popOut')}
            onClick={onPopOut}
            isActive={isPoppedOut}
            size="md"
          >
            <Icon
              of={PictureInPictureIcon}
              whenActive={PictureInPictureFilledIcon}
              isActive={isPoppedOut}
              size={20}
            />
          </Button>
        )}

        {onToggleGlow === undefined ? null : (
          <Button
            isIconOnly
            variant="ghost"
            label={
              isGlowing
                ? say('screens.videoPlayer.playerControls.leaveTheImmersiveView')
                : say('screens.videoPlayer.playerControls.immersiveView')
            }
            isActive={isGlowing}
            onClick={onToggleGlow}
            size="md"
          >
            <Icon of={MonitorIcon} whenActive={MonitorFilledIcon} isActive={isGlowing} size={20} />
          </Button>
        )}

        <Button
          isIconOnly
          variant="ghost"
          label={
            isFullscreen
              ? say('screens.readerChrome.leaveFullScreen')
              : say('screens.readerChrome.fillTheScreen')
          }
          onClick={onToggleFullscreen}
          size="md"
        >
          {isFullscreen ? (
            <Icon of={MinimizeIcon} size={20} />
          ) : (
            <Icon of={MaximizeIcon} size={20} />
          )}
        </Button>
      </div>
    </div>
  );
};

PlayerControls.displayName = 'PlayerControls';

export { PlayerControls };
