import { notify } from '@ValenceUI/notify';
import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { Form } from '@ValenceUI/Form';
import { RefuseFormSchema } from './RefuseFormSchema';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { refuseMediaRequest } from '@ValenceClient/requests/fetchMediaRequests';
import type { RefuseRequestDialogProps } from './RefuseRequestDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Refuses a request, with a reason for whoever asked where there is one worth giving. Several
 * chosen at once are refused together, with the one reason between them, which is the only reason
 * worth typing when the answer to all of them is the same.
 *
 * @param request - The request, or nothing while the dialog is closed.
 * @param howMany - How many are being refused, where more than this one were chosen.
 * @param onClose - Called when it is dismissed.
 * @param onRefused - Told the request once it is refused.
 * @param onRefuseMany - Told the reason instead, where more than one was chosen.
 */
const RefuseRequestDialog = ({
  request,
  howMany = 1,
  onClose,
  onRefused,
  onRefuseMany,
}: RefuseRequestDialogProps) => {
  const isMany = howMany > 1 && onRefuseMany !== undefined;
  const title = isMany
    ? sayCount('screens.adminArea.refuseRequestDialog.refuseCountRequests', howMany)
    : request === null
      ? say('screens.adminArea.refuseRequestDialog.refuseThisRequest')
      : say('screens.adminArea.refuseRequestDialog.refuseTitle', { title: request.title });

  const form = useZodForm(RefuseFormSchema, { reason: '' }, async (answers, { reset }) => {
    if (request === null) {
      return null;
    }

    if (isMany) {
      reset({ reason: '' });
      onRefuseMany(answers.reason);

      return null;
    }

    const { value, refusal } = await refuseMediaRequest(request.id, answers.reason);

    if (value === null) {
      return refusal?.message ?? say('screens.adminArea.refuseRequestDialog.itCouldNotBeRefused');
    }

    notify.worked(
      say('screens.adminArea.refuseRequestDialog.refusedTitle', { title: request.title }),
    );
    reset({ reason: '' });
    onRefused(value);
    onClose();

    return null;
  });

  return (
    <DialogCompanion label={title} isOpen={request !== null} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail={say('screens.adminArea.refuseRequestDialog.nothingIsFetchedForItIt')}
      />

      <Form label={title} onSubmit={form.submit} isDialog>
        <DialogContent>
          <TextField
            label={say('common.why')}
            {...form.text('reason')}
            placeholder={say('screens.adminArea.refuseRequestDialog.optional')}
            description={
              isMany
                ? say('screens.adminArea.refuseRequestDialog.shownToEverybodyWhoRequestedOne')
                : request === null
                  ? say('screens.adminArea.refuseRequestDialog.shownToWhoeverAsked')
                  : say('screens.adminArea.refuseRequestDialog.shownToName', {
                      name: request.requestedBy.name,
                    })
            }
          />
        </DialogContent>

        <DialogFooter
          note={form.problem}
          dismiss={{ onChoose: onClose }}
          confirm={{
            label: say('common.refuse'),
            isSubmit: true,
            isLoading: form.isSubmitting,
            isDestructive: true,
          }}
        />
      </Form>
    </DialogCompanion>
  );
};

RefuseRequestDialog.displayName = 'RefuseRequestDialog';

export { RefuseRequestDialog };
