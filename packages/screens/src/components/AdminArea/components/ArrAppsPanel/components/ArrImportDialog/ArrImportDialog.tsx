import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { ArrImportStep } from '@ValenceScreens/components/ImportWizard/components/ArrImportStep/ArrImportStep';
import type { ArrImportDialogProps } from './ArrImportDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Bringing a Radarr, Sonarr, Lidarr, Prowlarr and Overseerr or Jellyseerr setup in from the admin's
 * requests area, at any time after setup: the same step the import wizard shows, in a dialog that
 * closes once it is done.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Called when it is dismissed or the import is done.
 */
const ArrImportDialog = ({ isOpen, onClose }: ArrImportDialogProps) => {
  const title = say('screens.adminArea.arrAppsPanel.bringInASetup');

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose} size="stage">
      <DialogTitle
        size="compact"
        title={title}
        detail={say('screens.adminArea.arrAppsPanel.bringInASetupDetail')}
      />
      <DialogContent>{isOpen ? <ArrImportStep onDone={onClose} /> : null}</DialogContent>
    </DialogCompanion>
  );
};

ArrImportDialog.displayName = 'ArrImportDialog';

export { ArrImportDialog };
