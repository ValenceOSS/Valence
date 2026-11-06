import { useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SelectField } from '@ValenceUI/SelectField';
import { notify } from '@ValenceUI/notify';
import { chooseExtra } from '@ValenceClient/admin/chooseExtra';
import { EXTRA_KIND_LABELS, EXTRA_KINDS } from '@ValenceContracts/schemas/Library';
import type { ExtraChoiceDialogProps } from './ExtraChoiceDialog.types';
import { say } from '@ValenceI18n/say';

const NOT_AN_EXTRA = 'none';

const BY_NAME = 'names';

const OPTIONS = [
  { id: BY_NAME, label: say('screens.adminArea.extraChoice.asItsNameAndFolderSay') },
  { id: NOT_AN_EXTRA, label: say('screens.adminArea.extraChoice.notAnExtra') },
  ...EXTRA_KINDS.map((kind) => ({ id: kind, label: EXTRA_KIND_LABELS[kind] })),
];

/**
 * Says what a file beside a film is: one of the film's extras, of the kind chosen, or not an extra
 * but a film of its own, whatever its name or folder says, and keeps that through every scan.
 *
 * @param file - The file, or nothing while it is closed.
 * @param title - The film it is beside.
 * @param onClose - Closes it.
 * @param onChanged - Told the job reading the file again.
 */
const ExtraChoiceDialog = ({ file, title, onClose, onChanged }: ExtraChoiceDialogProps) => {
  const [kind, setKind] = useState<string>(BY_NAME);
  const [isBusy, setIsBusy] = useState(false);

  const apply = async () => {
    if (file === null) {
      return;
    }

    const extraKind = EXTRA_KINDS.find((one) => one === kind) ?? null;

    setIsBusy(true);

    const answer = await chooseExtra(file.mediaId, {
      extraKind,
      parentId: extraKind === null ? null : title.mediaId,
      ...(kind === BY_NAME ? { isForgotten: true } : {}),
    });

    setIsBusy(false);

    if (answer.kind === 'refused') {
      notify.failed(answer.reason);

      return;
    }

    notify.worked(say('screens.adminArea.episodeNumberDialog.readingItAgain'));
    onChanged(answer.jobId);
    onClose();
  };

  return (
    <Dialog
      label={say('screens.adminArea.extraChoice.whatIsThisFile', { file: file?.name ?? '' })}
      isOpen={file !== null}
      onClose={onClose}
    >
      <DialogTitle
        size="compact"
        title={say('screens.adminArea.extraChoice.whatIsThisFile', { file: file?.name ?? '' })}
      />
      <DialogContent className="flex flex-col gap-4">
        <p className="font-body text-sm text-text-muted">
          {say('screens.adminArea.extraChoice.keptThroughEveryScan', { title: title.name })}
        </p>
        <SelectField
          label={say('screens.adminArea.extraChoice.whatItIs')}
          options={OPTIONS}
          value={kind}
          onSelect={setKind}
        />
      </DialogContent>
      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('screens.adminArea.fixMatchDialog.apply'),
          isLoading: isBusy,
          onChoose: () => {
            void apply();
          },
        }}
      />
    </Dialog>
  );
};

ExtraChoiceDialog.displayName = 'ExtraChoiceDialog';

export { ExtraChoiceDialog };
