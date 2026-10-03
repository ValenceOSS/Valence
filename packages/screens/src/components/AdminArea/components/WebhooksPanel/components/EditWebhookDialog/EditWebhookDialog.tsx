import { useEffect, useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { useHeldWhileClosing } from '@ValenceUI/Dialog.useHeldWhileClosing';
import { isSubscribableEvent } from '@ValenceContracts/schemas/Webhook';
import type { FormEvent } from 'react';
import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { Form } from '@ValenceUI/Form';
import { A_NEW_WEBHOOK } from '@ValenceScreens/components/AdminArea/components/WebhookFields/A_NEW_WEBHOOK';
import { paneOfFirstProblem } from '@ValenceScreens/components/AdminArea/components/WebhookFields/paneOfFirstProblem';
import { webhookFormSchema } from '@ValenceScreens/components/AdminArea/components/WebhookFields/webhookFormSchema';
import { WebhookFields } from '@ValenceScreens/components/AdminArea/components/WebhookFields/WebhookFields';
import {
  WEBHOOK_PANES,
  WEBHOOK_PANE_ITEMS,
  isWebhookPane,
} from '@ValenceScreens/components/AdminArea/components/WebhookFields/webhookPanes';
import type { EditWebhookDialogProps } from './EditWebhookDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Changes a subscription that already exists, so that trying a different set of events is a matter of
 * ticking a box rather than making a second subscription with a second secret and deleting the first.
 *
 * The signing secret is never touched. Everything else about a subscription can be changed, including
 * where it points — repointing an endpoint is an ordinary thing to want, and the alternative is
 * recreating the subscription and re-signing whatever reads it.
 *
 * @param webhook - The subscription being changed, or nothing where the dialog is closed.
 * @param onClose - Called when it is dismissed.
 * @param onSave - Called with the change to make, answering with any refusal.
 * @param accounts - The accounts this subscription can be narrowed to.
 * @param profiles - The profiles this subscription can be narrowed to.
 * @param hasRequests - Whether requesting is on, without which its events are not offered.
 */
const EditWebhookDialog = ({
  webhook: requested,
  onClose,
  onSave,
  accounts,
  profiles,
  hasRequests = false,
}: EditWebhookDialogProps) => {
  const webhook = useHeldWhileClosing(requested, requested !== null);
  const [pane, setPane] = useState<(typeof WEBHOOK_PANES)[number]>('where');

  const form = useZodForm(webhookFormSchema, A_NEW_WEBHOOK, async (answers) => {
    if (webhook === null) {
      return null;
    }

    const answer = await onSave(webhook.id, answers);

    if (answer !== null) {
      return answer.message;
    }

    onClose();

    return null;
  });
  const { reset } = form;

  useEffect(() => {
    if (requested === null) {
      return;
    }

    reset({
      name: requested.name,
      url: requested.url,
      preset: requested.preset,
      events: requested.events.filter(isSubscribableEvent),
      filters: requested.filters,
    });
    setPane('where');
  }, [requested, reset]);

  const travel = useTravelDirection([...WEBHOOK_PANES], pane);

  if (webhook === null) {
    return null;
  }

  const send = (event: FormEvent) => {
    const off = paneOfFirstProblem(form.values);

    if (off !== null) {
      setPane(off);
    }

    form.submit(event);
  };

  return (
    <DialogCompanion
      label={say('common.editName', { name: webhook.name })}
      isOpen={requested !== null}
      onClose={onClose}
    >
      <Tabs
        value={pane}
        onValueChange={(next) => {
          if (isWebhookPane(next)) {
            setPane(next);
          }
        }}
      >
        <DialogTitle
          size="compact"
          title={say('common.editName', { name: webhook.name })}
          detail={say('screens.webhooksPanel.editWebhookDialog.itsSigningSecretStaysAsIt')}
          below={
            <TabRow
              label={say('common.whatToChange')}
              tone="underlined"
              size="sm"
              value={pane}
              groups={[{ items: WEBHOOK_PANE_ITEMS }]}
            />
          }
        />

        <Form label={say('common.edit')} onSubmit={send} isDialog>
          <DialogContent className="flex min-h-[34rem] flex-col gap-5">
            <WebhookFields
              draft={form.values}
              onChange={form.assign}
              errors={{
                name: form.errorOf('name'),
                url: form.errorOf('url'),
                events: form.errorOf('events'),
              }}
              accounts={accounts}
              profiles={profiles}
              hasRequests={hasRequests}
              travel={travel}
            />
          </DialogContent>

          <DialogFooter
            note={form.problem}
            dismiss={{ onChoose: onClose }}
            confirm={{
              label: form.isSubmitting
                ? say('screens.webhooksPanel.editWebhookDialog.saving')
                : say('common.saveChanges'),
              isSubmit: true,
              isLoading: form.isSubmitting,
            }}
          />
        </Form>
      </Tabs>
    </DialogCompanion>
  );
};

EditWebhookDialog.displayName = 'EditWebhookDialog';

export { EditWebhookDialog };
