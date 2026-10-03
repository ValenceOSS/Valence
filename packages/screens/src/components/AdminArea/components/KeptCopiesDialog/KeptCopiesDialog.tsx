import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bin as BinFilledIcon, Tape as TapeIcon } from '@keyline-icons/react/fill';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { NothingHere } from '@ValenceUI/NothingHere';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { removeRendition } from '@ValenceClient/admin/fetchReencodes';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { failureOfAnswer } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import type { KeptCopiesDialogProps } from './KeptCopiesDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * The copies kept alongside one film or episode — whether an administrator kept one or
 * pre-transcoding made it — each with what it is, how much it takes and the file it is, and a way
 * to remove it, which deletes the file as well.
 *
 * @param subject - The item whose copies are shown, or nothing while none is.
 * @param onClose - Called to put it away.
 */
const KeptCopiesDialog = ({ subject, onClose }: KeptCopiesDialogProps) => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.renditions(subject?.mediaId ?? null));
  const [removing, setRemoving] = useState<string | null>(null);
  const copies = asked.data ?? [];

  const remove = async (id: string) => {
    setRemoving(id);

    const isGone = await removeRendition(id);

    setRemoving(null);
    tellOutcome(
      say('screens.adminArea.keptCopiesDialog.removedTheCopy'),
      failureOfAnswer(isGone, say('screens.adminArea.keptCopiesDialog.thatCopyCouldNotBeRemoved')),
    );
    void cache.invalidateQueries({
      queryKey: adminQueries.renditions(subject?.mediaId ?? null).queryKey,
    });
    void cache.invalidateQueries({ queryKey: adminQueries.preTranscoding().queryKey });
  };

  const title =
    subject === null
      ? say('screens.adminArea.keptCopiesDialog.keptCopies')
      : say('screens.adminArea.keptCopiesDialog.copiesKeptOfName', { name: subject.name });

  return (
    <Dialog
      label={title}
      isOpen={subject !== null}
      onClose={onClose}
      className="sm:w-[min(36rem,92vw)]"
    >
      <DialogTitle
        title={title}
        detail={say('screens.adminArea.keptCopiesDialog.aDevicePlaysTheLargestCopy')}
      />

      <DialogContent className="flex flex-col gap-3">
        {asked.isError ? (
          <p className="text-sm text-text-muted">
            {say('screens.adminArea.keptCopiesDialog.theCopiesCouldNotBeRead')}
          </p>
        ) : copies.length === 0 ? (
          <NothingHere
            of={TapeIcon}
            title={say('screens.adminArea.keptCopiesDialog.noCopiesAreKept')}
            detail={say('screens.adminArea.keptCopiesDialog.aCopyIsMadeByKeeping')}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {copies.map((copy) => (
              <li
                key={copy.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-line bg-subtle p-3"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-text">
                    {copy.label} · {formatBytes(copy.sizeBytes)}
                  </span>
                  <span className="truncate font-body text-xs text-text-muted">
                    {copy.fileName}
                  </span>
                </span>

                <PanelCardAction
                  icon={BinFilledIcon}
                  isLoading={removing === copy.id}
                  onClick={() => {
                    void remove(copy.id);
                  }}
                >
                  {say('common.remove')}
                </PanelCardAction>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>

      <DialogFooter dismiss={{ label: say('common.close'), onChoose: onClose }} />
    </Dialog>
  );
};

KeptCopiesDialog.displayName = 'KeptCopiesDialog';

export { KeptCopiesDialog };
