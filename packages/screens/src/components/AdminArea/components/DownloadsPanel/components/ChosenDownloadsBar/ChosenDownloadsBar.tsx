import {
  Bin as BinFilledIcon,
  Pause as PauseFilledIcon,
  Play as PlayFilledIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PAUSABLE_STATES } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/PAUSABLE_STATES';
import type { ChosenDownloadsBarProps } from './ChosenDownloadsBar.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * What can be done to the downloads ticked in the queue, all at once: pausing those that can be
 * paused, resuming those that are paused, and removing the lot — each offered only where one of
 * them can take it, with how many are ticked beside them and a way to untick them all.
 *
 * @param total - How many downloads there are, said while none are ticked.
 * @param chosen - The downloads ticked.
 * @param isBusy - Whether they are being acted on now.
 * @param onPause - Told to pause the ones that can be.
 * @param onResume - Told to resume the ones that are paused.
 * @param onRemove - Told to remove them all.
 * @param onClear - Told to untick them all.
 */
const ChosenDownloadsBar = ({
  total,
  chosen,
  isBusy,
  onPause,
  onResume,
  onRemove,
  onClear,
}: ChosenDownloadsBarProps) => {
  const canPause = chosen.some((download) => PAUSABLE_STATES.has(download.state));
  const canResume = chosen.some((download) => download.state === 'paused');

  return (
    <div className="mr-auto flex flex-wrap items-center gap-3">
      <span className="text-sm text-text-muted">
        {chosen.length === 0
          ? sayCount('common.count.downloads', total)
          : sayCount('screens.adminArea.downloadsPanel.countChosen', chosen.length)}
      </span>

      {chosen.length === 0 ? null : (
        <>
          {canPause ? (
            <Button variant="secondary" size="xs" disabled={isBusy} onClick={onPause}>
              <Icon of={PauseFilledIcon} size={14} />
              {say('common.pause')}
            </Button>
          ) : null}

          {canResume ? (
            <Button variant="secondary" size="xs" disabled={isBusy} onClick={onResume}>
              <Icon of={PlayFilledIcon} size={14} />
              {say('common.resume')}
            </Button>
          ) : null}

          <Button variant="secondary" size="xs" disabled={isBusy} onClick={onRemove}>
            <Icon of={BinFilledIcon} size={14} />
            {say('common.forget')}
          </Button>

          <Button variant="ghost" size="xs" disabled={isBusy} onClick={onClear}>
            {say('screens.adminArea.downloadsPanel.untickThem')}
          </Button>
        </>
      )}
    </div>
  );
};

ChosenDownloadsBar.displayName = 'ChosenDownloadsBar';

export { ChosenDownloadsBar };
