import { useEffect, useRef, useState } from 'react';
import { Star as StarIcon } from '@keyline-icons/react';
import { Star as StarFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { VideoSurface } from '@ValenceUI/VideoSurface';
import { cn } from '@ValenceUI/cn';
import { DEFAULT_CAPTION_STYLE } from '@ValenceClient/playback/captionStyle';
import { watchLiveChannel } from '@ValenceClient/live/watchLiveChannel';
import { PlayerControls } from '@ValenceScreens/components/VideoPlayer/components/PlayerControls/PlayerControls';
import { attachShaka } from '@ValenceScreens/playback/attachShaka';
import { readLights } from '@ValenceScreens/library/readLights';
import { setLiveLights } from '@ValenceScreens/library/liveLights';
import { say } from '@ValenceI18n/say';
import type { LivePlayerProps } from './LivePlayer.types';

const GIVES_UP_AFTER_MS = 20_000;

const LOOKS_EVERY_MS = 200;

/**
 * A clock time as the viewer reads it, such as `19:30`.
 *
 * @param at - The moment, as an ISO string.
 * @returns The time.
 */
const timeOf = (at: string): string =>
  new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

/**
 * Plays one channel live, through the server, under the same controls as anything else Valence
 * plays — in their live form, with what is on now along the top in place of a timeline — and with
 * what is on now and next beneath it, and the page lit in the colours of the picture as it plays. A channel counts as playing once pictures arrive, and one
 * that sends none in a while says it could not be played rather than staying black. Changing
 * channel stops the last one and starts the next.
 *
 * @param channel - The channel.
 * @param onNow - What is on it now, where the guide knows.
 * @param upNext - What follows, where the guide knows.
 * @param now - The time now, in milliseconds.
 * @param onToggleFavourite - Told to keep the channel, or stop.
 */
const LivePlayer = ({ channel, onNow, upNext, now, onToggleFavourite }: LivePlayerProps) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<'starting' | 'playing' | 'failed'>('starting');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const noticeFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    };

    document.addEventListener('fullscreenchange', noticeFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', noticeFullscreen);
    };
  }, []);

  useEffect(() => {
    const element = videoRef.current;
    const life: { isGone: boolean; detach: (() => Promise<void>) | null } = {
      isGone: false,
      detach: null,
    };
    const hasLeft = () => life.isGone;
    const givingUp = setTimeout(() => {
      if (element === null || element.readyState < 3) {
        setState('failed');
      }
    }, GIVES_UP_AFTER_MS);
    const noticePlaying = () => {
      setState('playing');
    };

    setState('starting');
    element?.addEventListener('playing', noticePlaying);

    void watchLiveChannel(channel.id).then(async (sent) => {
      if (hasLeft() || element === null) {
        return;
      }

      if (sent.value === null) {
        setState('failed');

        return;
      }

      const attached = await attachShaka({
        element,
        manifestUrl: sent.value.manifestUrl,
        isSomeoneElses: true,
        onFault: () => {
          setState('failed');
        },
      }).catch(() => null);

      if (attached === null) {
        setState('failed');

        return;
      }

      if (hasLeft()) {
        void attached.detach();

        return;
      }

      life.detach = attached.detach;
      void element.play().catch(() => undefined);
    });

    return () => {
      life.isGone = true;
      clearTimeout(givingUp);
      element?.removeEventListener('playing', noticePlaying);
      void life.detach?.();
    };
  }, [channel.id]);

  useEffect(() => {
    const look = () => {
      const element = videoRef.current;

      if (element !== null && element.readyState > 1 && !element.paused) {
        const found = readLights(element);

        if (found.length > 0) {
          setLiveLights(found);
        }
      }
    };
    const timer = setInterval(look, LOOKS_EVERY_MS);

    return () => {
      clearInterval(timer);
      setLiveLights([]);
    };
  }, []);

  const startsAt = onNow === null ? null : Date.parse(onNow.startsAt);
  const endsAt = onNow === null ? null : Date.parse(onNow.endsAt);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={frameRef}
        className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-scrim"
      >
        <VideoSurface
          label={say('screens.liveTvPage.watchName', { name: channel.name })}
          videoRef={videoRef}
          className="size-full"
          onPlayingChange={setIsPlaying}
        />

        {state === 'playing' ? null : (
          <div className="absolute inset-0 flex items-center justify-center bg-scrim/60 p-6 text-center text-sm text-on-scrim">
            {state === 'starting' ? (
              <Spinner label={say('screens.liveTvPage.startingName', { name: channel.name })} />
            ) : (
              say('screens.liveTvPage.thatChannelCouldNotBePlayed')
            )}
          </div>
        )}

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 p-3 transition-opacity duration-[var(--duration-fast)] motion-reduce:transition-none',
            isPlaying
              ? 'opacity-0 focus-within:opacity-100 group-hover:opacity-100'
              : 'opacity-100',
          )}
        >
          <PlayerControls
            title={onNow?.title ?? channel.name}
            isLive
            {...(onNow === null
              ? {}
              : { liveDetail: `${timeOf(onNow.startsAt)} – ${timeOf(onNow.endsAt)}` })}
            isPlaying={isPlaying}
            position={startsAt === null ? 0 : (now - startsAt) / 1000}
            duration={startsAt === null || endsAt === null ? 0 : (endsAt - startsAt) / 1000}
            volume={volume}
            boost={1}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            isShowingStats={false}
            playbackRate={1}
            subtitleTracks={[]}
            selectedSubtitleId=""
            audioTracks={[]}
            selectedAudioIndex={null}
            availableQualitySteps={[]}
            selectedQuality="auto"
            isDisabled={state !== 'playing'}
            onTogglePlay={() => {
              const element = videoRef.current;

              if (element !== null) {
                void (element.paused ? element.play() : Promise.resolve(element.pause()));
              }
            }}
            onSeek={() => undefined}
            onSkip={() => undefined}
            onPlaybackRateChange={() => undefined}
            onSubtitleChange={() => undefined}
            onAudioChange={() => undefined}
            onQualityChange={() => undefined}
            playingId={channel.id}
            isShowingRemaining={false}
            onToggleTimeDisplay={() => undefined}
            captionStyle={DEFAULT_CAPTION_STYLE}
            onCaptionStyleChange={() => undefined}
            onCaptionStyleReset={() => undefined}
            onVolumeChange={(next) => {
              const element = videoRef.current;

              setVolume(next);

              if (element !== null) {
                element.volume = next;
                element.muted = next === 0;
                setIsMuted(element.muted);
              }
            }}
            onBoostChange={() => undefined}
            onToggleMute={() => {
              const element = videoRef.current;

              if (element !== null) {
                element.muted = !element.muted;
                setIsMuted(element.muted);
              }
            }}
            onToggleFullscreen={() => {
              void (
                document.fullscreenElement === null
                  ? frameRef.current?.requestFullscreen()
                  : document.exitFullscreen()
              )?.catch(() => undefined);
            }}
            onToggleStats={() => undefined}
          />
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2 text-sm text-text-muted">
            {channel.number === null ? null : (
              <span className="tabular-nums">{channel.number}</span>
            )}
            <span className="truncate">{channel.name}</span>
          </span>
          <h1 className="truncate text-xl font-semibold text-text">
            {onNow?.title ?? channel.name}
          </h1>
          {onNow?.description === null || onNow === null ? null : (
            <p className="line-clamp-2 text-sm text-text-muted">{onNow.description}</p>
          )}
          {upNext === null ? null : (
            <span className="text-xs text-text-muted">
              {say('screens.liveTvPage.nextTimeTitle', {
                time: timeOf(upNext.startsAt),
                title: upNext.title,
              })}
            </span>
          )}
        </div>
        <Button
          variant="subtle"
          size="sm"
          isIconOnly
          label={
            channel.isFavourite
              ? say('screens.liveTvPage.stopKeepingName', { name: channel.name })
              : say('screens.liveTvPage.keepName', { name: channel.name })
          }
          aria-pressed={channel.isFavourite}
          onClick={onToggleFavourite}
        >
          <Icon of={channel.isFavourite ? StarFilledIcon : StarIcon} size={16} />
        </Button>
      </div>
    </div>
  );
};

LivePlayer.displayName = 'LivePlayer';

export { LivePlayer };
