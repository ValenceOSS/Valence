import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { leaveOut } from '@ValenceClient/library/leaveOut';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { Form } from '@ValenceUI/Form';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { failureOfThrown } from '@ValenceScreens/admin/failureOf';
import { pathInLibrary } from '@ValenceScreens/components/AdminArea/pathInLibrary';
import { LeaveOutFormSchema } from './LeaveOutFormSchema';
import type { LeaveOutDialogProps } from './LeaveOutDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Asks before leaving a file or folder out of a library, and why, so its scans pass over it and
 * what was found there goes at the next one. Says plainly that nothing is deleted from the disk and
 * where to bring it back, since leaving something out reads as close to deleting it.
 *
 * @param target - What is to be left out, or null while nothing is.
 * @param onClose - Told when it is dismissed, or once it is done.
 */
const LeaveOutDialog = ({ target, onClose }: LeaveOutDialogProps) => {
  const cache = useQueryClient();
  const form = useZodForm(LeaveOutFormSchema, { note: '' }, async (answers) => {
    if (target === null) {
      return null;
    }

    const failure = await failureOfThrown(() =>
      leaveOut(target.libraryId, target.path, answers.note),
    );

    if (failure !== null) {
      return failure;
    }

    notify.worked(say('screens.adminArea.leaveOutDialog.nameIsLeftOut', { name: target.name }));
    await cache.invalidateQueries({ queryKey: libraryQueries.leftOut(target.libraryId).queryKey });
    onClose();

    return null;
  });
  const { reset } = form;
  const title =
    target === null
      ? say('common.leaveOutOfTheLibrary')
      : say('screens.adminArea.leaveOutDialog.leaveNameOut', { name: target.name });

  useEffect(() => {
    reset({ note: '' });
  }, [target, reset]);

  return (
    <DialogCompanion label={title} isOpen={target !== null} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail={target === null ? '' : pathInLibrary(target.path, target.libraryPath)}
      />

      <Form label={title} onSubmit={form.submit} isDialog>
        <DialogContent className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-text-muted">
            {target?.isFolder === true
              ? say('screens.adminArea.leaveOutDialog.scansPassOverThisFolder')
              : say('screens.adminArea.leaveOutDialog.scansPassOverThisFile')}
          </p>

          <TextField
            label={say('common.why')}
            description={say('screens.adminArea.leaveOutDialog.shownBesideItInThe')}
            placeholder={say('screens.adminArea.leaveOutDialog.breaksUpAnHourIn')}
            {...form.text('note')}
          />
        </DialogContent>

        <DialogFooter
          note={form.problem}
          dismiss={{ onChoose: onClose }}
          confirm={{
            label: say('screens.importWizard.librariesStep.leaveItOut'),
            isSubmit: true,
            isLoading: form.isSubmitting,
          }}
        />
      </Form>
    </DialogCompanion>
  );
};

LeaveOutDialog.displayName = 'LeaveOutDialog';

export { LeaveOutDialog };
