import { Monitor as MonitorIcon } from '@keyline-icons/react';
import { Pause as PauseIcon, Play as PlayIcon } from '@keyline-icons/react/fill';
import { useVideoRemote } from '@ValenceClient/video/useVideoRemote';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { VideoRemoteBarProps } from './VideoRemoteBar.types';
import { say } from '@ValenceI18n/say';

/**
 * The film this device is the remote for, kept in the corner of every page while it plays on the
 * television: which television, what is playing, and pause, with the whole remote a press away.
 * Nothing is drawn while this device controls nothing.
 *
 * @param onOpen - Told when the remote should open.
 */
const VideoRemoteBar = ({ onOpen }: VideoRemoteBarProps) => {
  const { device, watching, send } = useVideoRemote();

  if (device === null) {
    return null;
  }

  const isPlaying = watching?.isPlaying ?? false;

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-40 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="valence-card-shell pointer-events-auto">
        <div className="valence-card-face valence-card-face--raised flex items-center gap-2 p-2 pr-3">
          <Button
            variant="bare"
            size="none"
            label={say('screens.videoRemoteBar.openRemote', { device: device.label })}
            hasTooltip={false}
            className="flex min-w-0 items-center gap-2"
            onClick={onOpen}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-hover">
              <Icon of={MonitorIcon} size={20} />
            </span>

            <span className="flex min-w-0 flex-col items-start">
              <span className="max-w-44 truncate text-[0.8125rem] font-semibold text-text">
                {watching?.title ?? say('screens.videoRemoteBar.starting')}
              </span>
              <span className="max-w-44 truncate text-xs text-text-muted">
                {say('screens.videoRemoteBar.onDevice', { device: device.label })}
              </span>
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            label={
              isPlaying ? say('screens.videoRemoteBar.pause') : say('screens.videoRemoteBar.play')
            }
            disabled={watching === null}
            onClick={() => {
              send({ kind: isPlaying ? 'pause' : 'resume' });
            }}
          >
            <Icon of={isPlaying ? PauseIcon : PlayIcon} size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

VideoRemoteBar.displayName = 'VideoRemoteBar';

export { VideoRemoteBar };
