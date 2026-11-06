import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { editTitlesInParts } from '@ValenceClient/admin/editTitlesInParts';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TagField } from '@ValenceUI/TagField';
import { notify } from '@ValenceUI/notify';
import type { AddTagsDialogProps } from './AddTagsDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Adds tags to every title chosen at once, keeping the tags each already has, offering the tags in
 * use in the library as they are typed, and saving it as one change that is undone in one step.
 *
 * @param targets - The titles chosen, or nothing while it is closed.
 * @param libraryId - Their library, for suggesting its tags.
 * @param onClose - Closes it.
 * @param onDone - Told the change made, once saved.
 */
const AddTagsDialog = ({ targets, libraryId, onClose, onDone }: AddTagsDialogProps) => {
  const [tags, setTags] = useState<readonly string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const suggestions = useQuery({
    ...adminQueries.titleValues('tags', libraryId),
    enabled: targets !== null,
  });
  const count = targets?.length ?? 0;

  /**
   * Closes it, forgetting what was typed.
   */
  const close = () => {
    setTags([]);
    onClose();
  };

  return (
    <Dialog
      label={sayCount('screens.adminArea.addTagsDialog.count.addTagsToTitles', count)}
      isOpen={targets !== null}
      onClose={close}
      holdsOutsideClicks={tags.length > 0}
    >
      <DialogTitle
        title={sayCount('screens.adminArea.addTagsDialog.count.addTagsToTitles', count)}
      />

      <DialogContent>
        <TagField
          label={say('screens.adminArea.titleDetails.tags')}
          values={tags}
          onValuesChange={setTags}
          {...(suggestions.data === undefined ? {} : { suggestions: suggestions.data.values })}
        />
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: close }}
        confirm={{
          label: say('common.add'),
          isDisabled: tags.length === 0,
          isLoading: isSaving,
          onChoose: () => {
            if (targets === null) {
              return;
            }

            setIsSaving(true);

            void editTitlesInParts(targets, { add: { tags: [...tags] } })
              .then((outcome) => {
                onDone(outcome);
                close();
              })
              .catch((error: Error) => {
                notify.failed(error.message);
              })
              .finally(() => {
                setIsSaving(false);
              });
          },
        }}
      />
    </Dialog>
  );
};

AddTagsDialog.displayName = 'AddTagsDialog';

export { AddTagsDialog };
