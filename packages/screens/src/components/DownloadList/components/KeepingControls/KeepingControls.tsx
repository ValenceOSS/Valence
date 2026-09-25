import { RotateCw as RotateCwIcon, Smartphone as SmartphoneIcon } from '@keyline-icons/react';
import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { keptFraction } from '@ValenceCore/functions/describeKeeping';
import { keepAFile, pauseAFile } from '@ValenceClient/downloads/keepingFiles';
import type { KeepingControlsProps } from './KeepingControls.types';
import { say } from '@ValenceI18n/say';

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
        {say('screens.keepingControls.keep')}
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
        {say('screens.keepingControls.play')}
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
        {say('common.tryAgain')}
      </Button>
    );
  }

  return (
    <>
      {held.state !== 'fetching' ? null : (
        <ProgressBar
          value={keptFraction(held) ?? 0}
          max={1}
          label={say('screens.keepingControls.fetching', { title: download.title })}
          className="w-28"
        />
      )}

      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        label={
          held.state === 'paused'
            ? say('screens.keepingControls.resume', { title: download.title })
            : say('screens.keepingControls.pause', { title: download.title })
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
