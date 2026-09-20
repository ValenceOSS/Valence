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
import { WebhookFields } from '@ValenceScreens/components/AdminArea/components/WebhookFields/WebhookFields';
import {
  WEBHOOK_PANES,
  WEBHOOK_PANE_ITEMS,
  isWebhookPane,
} from '@ValenceScreens/components/AdminArea/components/WebhookFields/webhookPanes';
import type { WebhookDraft } from '@ValenceScreens/components/AdminArea/components/WebhookFields/WebhookFields.types';
import type { EditWebhookDialogProps } from './EditWebhookDialog.types';

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
  const [draft, setDraft] = useState<WebhookDraft | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pane, setPane] = useState<(typeof WEBHOOK_PANES)[number]>('where');

  useEffect(() => {
    if (requested === null) {
      return;
    }

    setDraft({
      name: requested.name,
      url: requested.url,
      preset: requested.preset,
      events: requested.events.filter(isSubscribableEvent),
      filters: requested.filters,
    });
    setRefusal(null);
    setPane('where');
  }, [requested]);

  const travel = useTravelDirection([...WEBHOOK_PANES], pane);

  if (webhook === null || draft === null) {
    return null;
  }

  const isReady = draft.name.trim() !== '' && draft.url.trim() !== '' && draft.events.length > 0;

  const save = () => {
    setIsSaving(true);
    setRefusal(null);

    void onSave(webhook.id, { ...draft, name: draft.name.trim(), url: draft.url.trim() })
      .then((answer) => {
        if (answer === null) {
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
    <DialogCompanion label={`Edit ${webhook.name}`} isOpen={requested !== null} onClose={onClose}>
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
          title={`Edit ${webhook.name}`}
          detail="Its signing secret stays as it is, so anything already checking deliveries keeps working."
          below={
            <TabRow
              label="What to change"
              tone="underlined"
              size="sm"
              value={pane}
              groups={[{ items: WEBHOOK_PANE_ITEMS }]}
            />
          }
        />

        <DialogContent className="flex flex-col gap-5">
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
          dismiss={{ onChoose: onClose }}
          confirm={{
            label: isSaving ? 'Saving…' : 'Save changes',
            onChoose: save,
            isDisabled: !isReady || isSaving,
          }}
        />
      </Tabs>
    </DialogCompanion>
  );
};

EditWebhookDialog.displayName = 'EditWebhookDialog';

export { EditWebhookDialog };
