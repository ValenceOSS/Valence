import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshTitle } from '@ValenceClient/admin/refreshTitle';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { Checkbox } from '@ValenceUI/Checkbox';
import { ChoiceList } from '@ValenceUI/ChoiceList';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { notify } from '@ValenceUI/notify';
import { labelOfField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/labelOfField';
import { fieldsToRefresh } from './fieldsToRefresh';
import type { RefreshMode } from '@ValenceClient/admin/refreshTitle';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import type { RefreshTitleDialogProps } from './RefreshTitleDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Asks the catalogue again about one title, in whichever of four ways is wanted: its details,
 * keeping its match and edits; only the fields ticked; a new match from its file names; or its
 * artwork fetched afresh.
 *
 * @param mediaId - A file of the title.
 * @param name - What the title is called.
 * @param kind - Whether it is a film or a programme.
 * @param isMatched - Whether it is matched, without which it has no fields to ask for again.
 * @param isOpen - Whether the dialog is open.
 * @param onClose - Closes it.
 * @param onStarted - Told the refresh is under way, with the job doing it where there is one.
 */
const RefreshTitleDialog = ({
  mediaId,
  name,
  kind,
  isMatched,
  isOpen,
  onClose,
  onStarted,
}: RefreshTitleDialogProps) => {
  const queries = useQueryClient();
  const offered = fieldsToRefresh(kind);
  const [mode, setMode] = useState<RefreshMode>('details');
  const [ticked, setTicked] = useState<ReadonlySet<TitleField>>(new Set(['rating']));
  const [isSending, setIsSending] = useState(false);

  const refresh = async () => {
    setIsSending(true);

    const answer = await refreshTitle(
      mediaId,
      mode,
      mode === 'fields' ? offered.filter((field) => ticked.has(field)) : [],
    );

    setIsSending(false);

    if (answer.kind === 'refused') {
      notify.failed(answer.reason);

      return;
    }

    notify.worked(say('screens.adminArea.refreshTitleDialog.askedTmdbAgain'));
    void queries.invalidateQueries({
      queryKey: adminQueries.titleMetadata(mediaId, 'title').queryKey,
    });
    void queries.invalidateQueries({
      queryKey: adminQueries.titleHistory(mediaId, 'title').queryKey,
    });
    onStarted(answer.jobId);
    onClose();
  };

  return (
    <Dialog
      label={say('screens.adminArea.refreshTitleDialog.refreshName', { name })}
      isOpen={isOpen}
      onClose={onClose}
    >
      <DialogTitle
        size="compact"
        title={say('screens.adminArea.refreshTitleDialog.refreshName', { name })}
      />

      <DialogContent className="flex flex-col gap-5">
        <ChoiceList
          label={say('screens.adminArea.refreshTitleDialog.whatToAskAgain')}
          look="rows"
          value={mode}
          onChoose={(id) => {
            if (
              id === 'details' ||
              id === 'fields' ||
              id === 'matchAgain' ||
              id === 'artwork' ||
              id === 'files'
            ) {
              setMode(id);
            }
          }}
          choices={[
            {
              id: 'details',
              title: say('screens.adminArea.refreshTitleDialog.updateDetails'),
              detail: say('screens.adminArea.refreshTitleDialog.updateDetailsDetail'),
            },
            {
              id: 'fields',
              title: say('screens.adminArea.refreshTitleDialog.updateSomeFields'),
              detail: say('screens.adminArea.refreshTitleDialog.updateSomeFieldsDetail'),
              isDisabled: !isMatched,
              ...(isMatched
                ? {}
                : { note: say('screens.adminArea.refreshTitleDialog.onlyAMatchedTitle') }),
            },
            {
              id: 'matchAgain',
              title: say('screens.adminArea.refreshTitleDialog.matchAgain'),
              detail: say('screens.adminArea.refreshTitleDialog.matchAgainDetail'),
            },
            {
              id: 'files',
              title: say('screens.adminArea.refreshTitleDialog.readTheFilesAgain'),
              detail: say('screens.adminArea.refreshTitleDialog.readTheFilesAgainDetail'),
            },
            {
              id: 'artwork',
              title: say('screens.adminArea.refreshTitleDialog.fetchArtwork'),
              detail: say('screens.adminArea.refreshTitleDialog.fetchArtworkDetail'),
            },
          ]}
        />

        {mode === 'fields' ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-medium text-text">
              {say('screens.adminArea.refreshTitleDialog.fieldsToUpdate')}
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {offered.map((field) => (
                <Checkbox
                  key={field}
                  label={labelOfField(field, kind)}
                  checked={ticked.has(field)}
                  onCheckedChange={(isTicked) => {
                    setTicked((before) => {
                      const next = new Set(before);

                      if (isTicked) {
                        next.add(field);
                      } else {
                        next.delete(field);
                      }

                      return next;
                    });
                  }}
                />
              ))}
            </div>
          </fieldset>
        ) : null}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose, label: say('common.cancel') }}
        confirm={{
          label: say('screens.adminArea.refreshTitleDialog.refresh'),
          onChoose: () => {
            void refresh();
          },
          isLoading: isSending,
          isDisabled: mode === 'fields' && !offered.some((field) => ticked.has(field)),
        }}
      />
    </Dialog>
  );
};

RefreshTitleDialog.displayName = 'RefreshTitleDialog';

export { RefreshTitleDialog };
