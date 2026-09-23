import {
  RotateCcw as BackIcon,
  RotateCw as ForwardIcon,
  Stop as StopIcon,
} from '@keyline-icons/react';
import { Pause as PauseIcon, Play as PlayIcon } from '@keyline-icons/react/fill';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { useVideoRemote } from '@ValenceClient/video/useVideoRemote';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { Slider } from '@ValenceUI/Slider';
import type { VideoRemoteProps } from './VideoRemote.types';

const BACK_BY = 10;

const ON_BY = 30;

/**
 * This device as the remote for the television playing a film: the film's picture and name, how
 * far through it is, and the buttons a remote has — back ten seconds, play and pause, on thirty,
 * and stop — with a bar to drag to anywhere in it. The film can be brought back here from where the
 * television had got to, stopping it there.
 *
 * Closing the remote leaves the film playing; the bar in the corner opens it again.
 *
 * @param isOpen - Whether it is showing.
 * @param onClose - Told when it should close.
 * @param onPlayHere - Told which film to play here, and from where, once it is brought back.
 */
const VideoRemote = ({ isOpen, onClose, onPlayHere }: VideoRemoteProps) => {
  const { device, watching, positionSeconds, send, release } = useVideoRemote();
  const isPlaying = watching?.isPlaying ?? false;

  return (
    <Dialog
      label={device === null ? 'Remote' : `Remote for ${device.label}`}
      isOpen={isOpen && device !== null}
      onClose={onClose}
      className="sm:w-[min(30rem,92vw)]"
    >
      <DialogTitle
        title={watching?.title ?? 'Starting…'}
        detail={
          device === null
            ? undefined
            : `${watching?.subtitle === null || watching === null ? '' : `${watching.subtitle} · `}On ${device.label}`
        }
      />

      <DialogContent className="flex flex-col gap-5">
        {watching !== null && watching.hasBackdrop ? (
          <img
            src={artworkUrl(watching.mediaId, 'backdrop')}
            alt=""
            className="aspect-video w-full rounded-lg object-cover"
          />
        ) : null}

        <div className="flex flex-col gap-1">
          <Slider
            label="Where the film is up to"
            value={positionSeconds}
            max={Math.max(watching?.durationSeconds ?? 0, 1)}
            step={1}
            isDisabled={watching === null}
            valueLabel={formatDuration}
            onValueChange={() => undefined}
            onValueCommit={(seconds) => {
              send({ kind: 'seek', positionSeconds: seconds });
            }}
          />
          <div className="flex justify-between font-mono text-xs text-text-muted tabular-nums">
            <span>{formatDuration(positionSeconds)}</span>
            <span>
              -{formatDuration(Math.max((watching?.durationSeconds ?? 0) - positionSeconds, 0))}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            isIconOnly
            label={`Back ${BACK_BY.toString()} seconds`}
            disabled={watching === null}
            onClick={() => {
              send({ kind: 'skip', seconds: -BACK_BY });
            }}
          >
            <Icon of={BackIcon} size={24} />
          </Button>

          <Button
            variant="confirm"
            size="xl"
            isIconOnly
            isPill
            label={isPlaying ? 'Pause' : 'Play'}
            disabled={watching === null}
            onClick={() => {
              send({ kind: isPlaying ? 'pause' : 'resume' });
            }}
          >
            <Icon of={isPlaying ? PauseIcon : PlayIcon} size={28} />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            isIconOnly
            label={`On ${ON_BY.toString()} seconds`}
            disabled={watching === null}
            onClick={() => {
              send({ kind: 'skip', seconds: ON_BY });
            }}
          >
            <Icon of={ForwardIcon} size={24} />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={watching === null}
            onClick={() => {
              if (watching === null) {
                return;
              }

              send({ kind: 'stop' });
              release();
              onClose();
              onPlayHere(watching.mediaId, positionSeconds);
            }}
          >
            Play here
          </Button>

          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              send({ kind: 'stop' });
              release();
              onClose();
            }}
          >
            <Icon of={StopIcon} size={16} />
            Stop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

VideoRemote.displayName = 'VideoRemote';

export { VideoRemote };
