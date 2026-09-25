import { Icon } from '@ValenceUI/Icon';
import { X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { useOfflineMode } from '@ValenceClient/offline/useOfflineMode';
import { canKeepFiles } from '@ValenceClient/downloads/canKeepFiles';
import { DownloadList } from '@ValenceScreens/components/DownloadList/DownloadList';
import type { DownloadsDialogProps } from './DownloadsDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Everything this viewer has asked the server to prepare, raised over whatever they were looking at.
 *
 * Checking on a download is looking in on work rather than going somewhere: you glance at it, see
 * that the film you asked for an hour ago is ready, and carry on with what you were doing. Closing
 * it puts back the page underneath, which is what a glance should do.
 *
 * A browser cannot keep files, so there it only shows how far along everything asked for on other
 * devices has got. Going offline is offered only where files can be kept: a client that can hold
 * nothing has nothing to be offline with, so the switch belongs beside the things it would show.
 *
 * @param isOpen - Whether the address has it open.
 * @param onClose - Told it was dismissed.
 */
const DownloadsDialog = ({ isOpen, onClose }: DownloadsDialogProps) => {
  const { isByChoice, goOffline } = useOfflineMode();
  const isKeepable = canKeepFiles();

  return (
    <Dialog label={say('screens.downloadsDialog.heading')} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        title={say('screens.downloadsDialog.heading')}
        detail={
          isKeepable
            ? say('screens.downloadsDialog.keepableDetail')
            : say('screens.downloadsDialog.browserDetail')
        }
      >
        <Button variant="ghost" size="sm" isIconOnly label={say('common.close')} onClick={onClose}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <DialogContent className="px-0">
        {isKeepable ? (
          <SettingList>
            <SettingRow
              title={say('screens.downloadsDialog.goOffline')}
              description={say('screens.downloadsDialog.goOfflineDetail')}
            >
              <Switch
                isOn={isByChoice}
                label={say('screens.downloadsDialog.goOffline')}
                isLabelHidden
                onToggle={() => {
                  goOffline(!isByChoice);
                }}
              />
            </SettingRow>
          </SettingList>
        ) : null}

        <DownloadList />
      </DialogContent>
    </Dialog>
  );
};

DownloadsDialog.displayName = 'DownloadsDialog';

export { DownloadsDialog };
