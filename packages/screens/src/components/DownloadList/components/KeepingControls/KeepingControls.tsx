import { RotateCw as RotateCwIcon, Smartphone as SmartphoneIcon } from '@keyline-icons/react';
import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { keptFraction } from '@ValenceCore/functions/describeKeeping';
import { keepAFile, pauseAFile } from '@ValenceClient/downloads/keepingFiles';
import type { KeepingControlsProps } from './KeepingControls.types';

/**
 * What can be done about the copy of a prepared download on this machine.
 *
 * Once the copy is here, what is offered is playing it from this disk. Throwing it away is the row's
 * one delete, which lets go of this copy and the server's together.
 *
 * @param download - What the server prepared.
 * @param held - The copy on this machine, where there is one.
 */
const KeepingControls = ({ download, held }: KeepingControlsProps) => {
  const go = useNavigate();

  if (held === null) {
    return (
      <Button
        variant="glossy"
        size="sm"
        onClick={() => {
          void keepAFile(download);
        }}
      >
        <Icon of={SmartphoneIcon} size={15} />
        Keep on this device
      </Button>
    );
  }

  if (held.state === 'here') {
    return (
      <Button
        variant="glossy"
        size="sm"
        onClick={() => {
          void go({ to: '/kept/$downloadId', params: { downloadId: download.id } });
        }}
      >
        <Icon of={PlayFilledIcon} size={15} />
        Play
      </Button>
    );
  }

  if (held.state === 'failed') {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          void pauseAFile(download.id, false);
        }}
      >
        <Icon of={RotateCwIcon} size={15} />
        Try again
      </Button>
    );
  }

  return (
    <>
      {held.state !== 'fetching' ? null : (
        <ProgressBar
          value={keptFraction(held) ?? 0}
          max={1}
          label={`Fetching ${download.title} to this device`}
          className="w-28"
        />
      )}

      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        label={
          held.state === 'paused'
            ? `Carry on fetching ${download.title}`
            : `Stop fetching ${download.title} for now`
        }
        onClick={() => {
          void pauseAFile(download.id, held.state !== 'paused');
        }}
      >
        <Icon of={held.state === 'paused' ? PlayFilledIcon : PauseFilledIcon} size={16} />
      </Button>
    </>
  );
};

KeepingControls.displayName = 'KeepingControls';

export { KeepingControls };
