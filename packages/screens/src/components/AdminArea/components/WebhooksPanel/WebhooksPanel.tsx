import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { Switch } from '@ValenceUI/Switch';
import { WEBHOOK_EVENT_LABELS } from '@ValenceContracts/schemas/Webhook';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { AddWebhookDialog } from './components/AddWebhookDialog/AddWebhookDialog';
import { EditWebhookDialog } from './components/EditWebhookDialog/EditWebhookDialog';
import { DeliveryHistory } from './components/DeliveryHistory/DeliveryHistory';
import { say } from '@ValenceI18n/say';
import type { WebhookSubscription } from '@ValenceContracts/schemas/Webhook';
import type { WebhooksPanelProps } from './WebhooksPanel.types';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';

/**
 * Says how a subscription's last delivery went, in a word and a colour: never used, when it last
 * succeeded, or what went wrong. The failing case is coloured because a webhook that has quietly
 * stopped working looks exactly like one nothing has happened for.
 *
 * @param webhook - The subscription.
 * @param now - The moment to measure against.
 * @returns How alarming it is, and what to say.
 */
const describeLastAttempt = (
  webhook: WebhookSubscription,
  now: number,
): { tone: 'quiet' | 'danger'; label: string } => {
  if (webhook.lastAttemptAt === null) {
    return { tone: 'quiet', label: say('admin.webhooksPanel.neverUsed') };
  }

  if (webhook.lastError === null) {
    return {
      tone: 'quiet',
      label: say('admin.webhooksPanel.delivered', {
        when: describeSince(webhook.lastAttemptAt, now),
      }),
    };
  }

  return {
    tone: 'danger',
    label: say('admin.webhooksPanel.failingSince', {
      when: describeSince(webhook.lastAttemptAt, now),
    }),
  };
};

/**
 * Where an operator says what they want to be told about and sees whether they are still being told:
 * the subscriptions, what each last did, and a way to test, pause, remove or look through the
 * deliveries of any of them. A new subscription's secret is shown once, on creation, and never
 * again.
 *
 * @param webhooks - The subscriptions configured.
 * @param created - A subscription just made, whose secret is still being shown.
 * @param onCreate - Called with a subscription to make, answering with any refusal.
 * @param onEdit - Called with a subscription to change, answering with any refusal.
 * @param accounts - The accounts a new subscription can be narrowed to.
 * @param profiles - The profiles a new subscription can be narrowed to.
 * @param hasRequests - Whether requesting is on, without which its events are not offered.
 * @param onDismissCreated - Called once the secret has been taken down.
 * @param onSetEnabled - Called with a subscription and whether it should be delivering.
 * @param onDelete - Called with the subscription to remove.
 * @param onTest - Called with the subscription to send a test to.
 * @param deliveries - The deliveries of whichever subscription's history is open.
 * @param openHistoryId - The subscription whose history is open, if any.
 * @param isHistoryLoading - Whether that history is still being fetched.
 * @param onOpenHistory - Called with the subscription whose history to open, or null to close it.
 * @param onRedeliver - Called with a delivery to send again.
 */
const WebhooksPanel = ({
  webhooks,
  created,
  onCreate,
  onEdit,
  accounts,
  profiles,
  hasRequests = false,
  onDismissCreated,
  onSetEnabled,
  onDelete,
  onTest,
  deliveries,
  openHistoryId,
  isHistoryLoading,
  onOpenHistory,
  onRedeliver,
}: WebhooksPanelProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<WebhookSubscription | null>(null);
  const [deleting, setDeleting] = useState<WebhookSubscription | null>(null);
  const now = useTicking(A_CAPTION_AGES_EVERY);

  return (
    <div className="flex flex-col gap-4">
      <EditWebhookDialog
        webhook={editing}
        accounts={accounts}
        profiles={profiles}
        hasRequests={hasRequests}
        onClose={() => {
          setEditing(null);
        }}
        onSave={onEdit}
      />

      <AddWebhookDialog
        accounts={accounts}
        profiles={profiles}
        hasRequests={hasRequests}
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
        }}
        onCreate={onCreate}
      />

      <ConfirmDialog
        title={
          deleting === null
            ? say('admin.webhooksPanel.deleteThisTitle')
            : say('admin.webhooksPanel.deleteTitle', { name: deleting.name })
        }
        detail={say('admin.webhooksPanel.deleteDetail')}
        confirmLabel={say('common.delete')}
        isDestructive
        isOpen={deleting !== null}
        onClose={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (deleting !== null) {
            onDelete(deleting.id);
          }

          setDeleting(null);
        }}
      />

      {created === null ? null : (
        <PanelCard title={say('admin.webhooksPanel.newWebhook')} isHighlighted>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text">
                {say('admin.webhooksPanel.setUp', { name: created.name })}
              </span>

              <span className="text-xs text-text-muted">
                {say('admin.webhooksPanel.secretDetail')}
              </span>
            </div>

            <code className="select-all break-all rounded-lg bg-[var(--surface-hover)] px-3 py-2 font-mono text-xs text-text">
              {created.secret}
            </code>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={onDismissCreated}>
                {say('admin.webhooksPanel.copiedIt')}
              </Button>
            </div>
          </div>
        </PanelCard>
      )}

      <PanelCard
        title={say('admin.webhooksPanel.heading')}
        isFlush
        actions={
          <PanelCardAction
            icon={PlusIcon}
            onClick={() => {
              setIsAdding(true);
            }}
          >
            {say('admin.webhooksPanel.createWebhook')}
          </PanelCardAction>
        }
      >
        {webhooks.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-muted">
            {say('admin.webhooksPanel.empty')}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
            {webhooks.map((webhook) => {
              const attempt = describeLastAttempt(webhook, now);

              return (
                <li key={webhook.id} className="flex flex-col gap-3 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-text">{webhook.name}</span>

                    <Badge tone={attempt.tone}>{attempt.label}</Badge>

                    {webhook.enabled ? null : (
                      <Badge tone="quiet">{say('admin.webhooksPanel.off')}</Badge>
                    )}
                  </div>

                  <span className="break-all text-xs text-text-muted">{webhook.url}</span>

                  <span className="text-xs text-text-muted">
                    {webhook.events
                      .filter((event) => event !== 'webhook.test')
                      .map((event) => WEBHOOK_EVENT_LABELS[event])
                      .join(' · ')}
                  </span>

                  {webhook.lastError === null ? null : (
                    <span className="text-xs text-danger">{webhook.lastError}</span>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Switch
                      label={say('admin.webhooksPanel.enabled')}
                      isOn={webhook.enabled}
                      onToggle={() => {
                        onSetEnabled(webhook.id, !webhook.enabled);
                      }}
                    />

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!webhook.enabled}
                      onClick={() => {
                        onTest(webhook.id);
                      }}
                    >
                      {say('admin.webhooksPanel.sendTest')}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditing(webhook);
                      }}
                    >
                      {say('admin.webhooksPanel.edit')}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      aria-expanded={openHistoryId === webhook.id}
                      onClick={() => {
                        onOpenHistory(openHistoryId === webhook.id ? null : webhook.id);
                      }}
                    >
                      {openHistoryId === webhook.id
                        ? say('admin.webhooksPanel.hideHistory')
                        : say('admin.webhooksPanel.history')}
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setDeleting(webhook);
                      }}
                    >
                      {say('common.delete')}
                    </Button>
                  </div>

                  {openHistoryId === webhook.id ? (
                    <DeliveryHistory
                      deliveries={deliveries}
                      isLoading={isHistoryLoading}
                      canRedeliver={webhook.enabled}
                      onRedeliver={(deliveryId) => {
                        onRedeliver(webhook.id, deliveryId);
                      }}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </PanelCard>
    </div>
  );
};

WebhooksPanel.displayName = 'WebhooksPanel';

export { WebhooksPanel };
