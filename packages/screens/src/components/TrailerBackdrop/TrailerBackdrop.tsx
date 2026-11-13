import { Volume as VolumeIcon, VolumeOff as VolumeOffIcon } from '@keyline-icons/react';
import { useReducedMotionConfig } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { VideoSurface } from '@ValenceUI/VideoSurface';
import { readSoundPreference, saveSoundPreference } from '@ValenceClient/playback/soundPreference';
import { attachShaka } from '@ValenceScreens/playback/attachShaka';
import { glassSquare } from '@ValenceScreens/components/PlayWithRestart/glassSquare';
import { say } from '@ValenceI18n/say';
import type { TrailerBackdropProps } from './TrailerBackdrop.types';

const SETTLE_MILLISECONDS = 1200;

/**
 * The picture behind something that can be asked for, as the phone draws it: its backdrop, and a
 * moment later its trailer fading in over it once it has a picture to show, silent unless this viewer last chose to hear one,
 * and giving way to the backdrop again when it ends. Somebody who asked for less movement keeps
 * the backdrop.
 *
 * The trailer is YouTube's own stream passed through the server and given to the media engine,
 * which hands it to the browser whole only where the browser has no other way to play it: Chrome
 * says it might play HLS itself and then shows no picture.
 *
 * Its controls sit in the top corner: sound, once the trailer is showing, and whatever closes the
 * dialog it heads.
 *
 * @param backdrop - The still picture.
 * @param trailerUrl - Where the trailer streams from, or nothing where there is none.
 * @param label - What the trailer is, read out.
 * @param closing - What sits after its own controls, such as closing the dialog.
 */
const TrailerBackdrop = ({ backdrop, trailerUrl, label, closing }: TrailerBackdropProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isStill = useReducedMotionConfig() === true;
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const element = videoRef.current;

    if (element === null || trailerUrl === null || isStill) {
      return;
    }

    const run: { isCurrent: boolean; detach: (() => Promise<void>) | null } = {
      isCurrent: true,
      detach: null,
    };
    const isStillCurrent = (): boolean => run.isCurrent;

    const start = async () => {
      await element.play();

      if (isStillCurrent() && readSoundPreference() !== 'muted') {
        element.muted = false;
        setIsMuted(false);
      }
    };

    const timer = setTimeout(() => {
      element.muted = true;

      void attachShaka({ element, manifestUrl: trailerUrl, isSomeoneElses: true })
        .then(async (attached) => {
          if (!isStillCurrent()) {
            await attached.detach();

            return;
          }

          run.detach = attached.detach;

          await start();
        })
        .catch(() => null);
    }, SETTLE_MILLISECONDS);

    return () => {
      run.isCurrent = false;
      clearTimeout(timer);
      setIsPlaying(false);
      setHasStarted(false);
      setHasEnded(false);
      setIsMuted(true);
      void run.detach?.();
    };
  }, [trailerUrl, isStill]);

  return (
    <div className="absolute inset-0">
      {backdrop}

      <VideoSurface
        label={label}
        videoRef={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          hasStarted && !hasEnded ? 'opacity-100' : 'opacity-0'
        }`}
        onPlayingChange={(playing) => {
          setIsPlaying(playing);

          if (playing) {
            setHasEnded(false);
          }
        }}
        onTimeUpdate={() => {
          if ((videoRef.current?.videoWidth ?? 0) > 0) {
            setHasStarted(true);
          }
        }}
        onEnded={() => {
          setHasEnded(true);
        }}
      />

      <div className="absolute end-4 top-4 z-10 flex items-center gap-2 sm:end-6 sm:top-6">
        {!isPlaying || !hasStarted || hasEnded ? null : (
          <Button
            variant="ghost"
            size="none"
            label={
              isMuted
                ? say('screens.mediaPreview.turnSoundOn')
                : say('screens.mediaPreview.turnSoundOff')
            }
            className={glassSquare}
            onClick={() => {
              const element = videoRef.current;

              if (element === null) {
                return;
              }

              const isSilenced = !isMuted;

              element.muted = isSilenced;
              setIsMuted(isSilenced);
              saveSoundPreference(isSilenced ? 'muted' : 'audible');
            }}
          >
            <Icon of={isMuted ? VolumeOffIcon : VolumeIcon} size={18} />
          </Button>
        )}

        {closing}
      </div>
    </div>
  );
};

TrailerBackdrop.displayName = 'TrailerBackdrop';

export { TrailerBackdrop };
