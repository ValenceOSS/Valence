import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { ReleaseSearchPanel } from '@ValenceScreens/components/AdminArea/components/ReleaseSearchPanel/ReleaseSearchPanel';
import type { ReleaseSearchDialogProps } from './ReleaseSearchDialog.types';

/**
 * Searching the indexers by hand, in a dialog: for something no catalogue knows, to see how one
 * indexer answers, or to see how a profile ranks what is found.
 *
 * @param title - What the dialog is for, or nothing while it is closed.
 * @param detail - A line under its title saying more.
 * @param onClose - Told when it was dismissed.
 * @param indexerIds - The indexers searched, where not every one.
 * @param profileId - The profile to judge against from the start.
 * @param query - What to search for from the start.
 */
const ReleaseSearchDialog = ({
  title,
  detail,
  onClose,
  indexerIds,
  profileId,
  query,
}: ReleaseSearchDialogProps) => (
  <DialogCompanion label={title ?? ''} isOpen={title !== null} onClose={onClose} size="stage">
    <DialogTitle size="compact" title={title ?? ''} detail={detail} />

    <DialogContent className="flex min-h-0 flex-1 flex-col">
      {title === null ? null : (
        <ReleaseSearchPanel
          {...(indexerIds === undefined ? {} : { indexerIds })}
          {...(profileId === undefined ? {} : { profileId })}
          {...(query === undefined ? {} : { query })}
        />
      )}
    </DialogContent>
  </DialogCompanion>
);

ReleaseSearchDialog.displayName = 'ReleaseSearchDialog';

export { ReleaseSearchDialog };
