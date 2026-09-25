import { useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { DEFAULT_WEBHOOK_FILTERS } from '@ValenceContracts/schemas/Webhook';
import { WebhookFields } from '@ValenceScreens/components/AdminArea/components/WebhookFields/WebhookFields';
import {
  WEBHOOK_PANES,
  webhookPaneItems,
  isWebhookPane,
} from '@ValenceScreens/components/AdminArea/components/WebhookFields/webhookPanes';
import { say } from '@ValenceI18n/say';
import type { WebhookDraft } from '@ValenceScreens/components/AdminArea/components/WebhookFields/WebhookFields.types';
import type { AddWebhookDialogProps } from './AddWebhookDialog.types';

const A_NEW_WEBHOOK: WebhookDraft = {
  name: '',
  url: '',
  preset: 'generic',
  events: ['job.failed'],
  filters: DEFAULT_WEBHOOK_FILTERS,
};

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
  const [draft, setDraft] = useState<WebhookDraft>(A_NEW_WEBHOOK);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pane, setPane] = useState<(typeof WEBHOOK_PANES)[number]>('where');

  const travel = useTravelDirection([...WEBHOOK_PANES], pane);

  const isReady = draft.name.trim() !== '' && draft.url.trim() !== '' && draft.events.length > 0;

  const reset = () => {
    setDraft(A_NEW_WEBHOOK);
    setRefusal(null);
    setPane('where');
  };

  const close = () => {
    reset();
    onClose();
  };

  const save = () => {
    setIsSaving(true);
    setRefusal(null);

    void onCreate({ ...draft, name: draft.name.trim(), url: draft.url.trim() })
      .then((answer) => {
        if (answer === null) {
          reset();
          onClose();

          return;
        }

        setRefusal(answer.message);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <DialogCompanion label={say('admin.addWebhookDialog.title')} isOpen={isOpen} onClose={close}>
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
          title={say('admin.addWebhookDialog.title')}
          detail={say('admin.addWebhookDialog.detail')}
          below={
            <TabRow
              label={say('admin.webhookPanes.tabsLabel')}
              tone="underlined"
              size="sm"
              value={pane}
              groups={[{ items: webhookPaneItems() }]}
            />
          }
        />

        <DialogContent className="flex min-h-[34rem] flex-col gap-5">
          <WebhookFields
            draft={draft}
            onChange={setDraft}
            accounts={accounts}
            profiles={profiles}
            hasRequests={hasRequests}
            travel={travel}
          />
        </DialogContent>

        <DialogFooter
          note={refusal}
          dismiss={{ onChoose: close }}
          confirm={{
            label: isSaving
              ? say('admin.addWebhookDialog.creating')
              : say('admin.addWebhookDialog.title'),
            onChoose: save,
            isDisabled: !isReady || isSaving,
          }}
        />
      </Tabs>
    </DialogCompanion>
  );
};

AddWebhookDialog.displayName = 'AddWebhookDialog';

export { AddWebhookDialog };
