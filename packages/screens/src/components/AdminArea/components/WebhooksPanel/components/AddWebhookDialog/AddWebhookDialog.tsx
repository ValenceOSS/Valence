import { useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
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
import type { AddWebhookDialogProps } from './AddWebhookDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Everything needed to point the server at somewhere new: where to deliver, which events to deliver,
 * and what to call it. Any refusal from the server is shown against the form rather than replacing
 * it, so nothing already typed is lost to a rejected address.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Called when it is dismissed.
 * @param onCreate - Called with the subscription to make, answering with any refusal.
 * @param accounts - The accounts a new subscription can be narrowed to.
 * @param profiles - The profiles a new subscription can be narrowed to.
 * @param hasRequests - Whether requesting is on, without which its events are not offered.
 */
const AddWebhookDialog = ({
  isOpen,
  onClose,
  onCreate,
  accounts,
  profiles,
  hasRequests = false,
}: AddWebhookDialogProps) => {
  const [pane, setPane] = useState<(typeof WEBHOOK_PANES)[number]>('where');

  const form = useZodForm(webhookFormSchema, A_NEW_WEBHOOK, async (answers, { reset }) => {
    const answer = await onCreate(answers);

    if (answer !== null) {
      return answer.message;
    }

    reset(A_NEW_WEBHOOK);
    setPane('where');
    onClose();

    return null;
  });

  const travel = useTravelDirection([...WEBHOOK_PANES], pane);

  const close = () => {
    form.reset(A_NEW_WEBHOOK);
    setPane('where');
    onClose();
  };

  const send = (event: FormEvent) => {
    const off = paneOfFirstProblem(form.values);

    if (off !== null) {
      setPane(off);
    }

    form.submit(event);
  };

  return (
    <DialogCompanion label={say('common.createWebhook')} isOpen={isOpen} onClose={close}>
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
          title={say('common.createWebhook')}
          detail={say('screens.webhooksPanel.addWebhookDialog.valenceWillPostToThisAddress')}
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

        <Form label={say('common.createWebhook')} onSubmit={send} isDialog>
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
            dismiss={{ onChoose: close }}
            confirm={{
              label: form.isSubmitting
                ? say('screens.webhooksPanel.addWebhookDialog.creating')
                : say('common.createWebhook'),
              isSubmit: true,
              isLoading: form.isSubmitting,
            }}
          />
        </Form>
      </Tabs>
    </DialogCompanion>
  );
};

AddWebhookDialog.displayName = 'AddWebhookDialog';

export { AddWebhookDialog };
