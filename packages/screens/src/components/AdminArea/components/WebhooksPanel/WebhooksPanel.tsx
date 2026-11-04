import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { NothingHere } from '@ValenceUI/NothingHere';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { Plus as PlusFilledIcon, Webhook as EmptyWebhookIcon } from '@keyline-icons/react/fill';
import { useEffect, useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { Icon } from '@ValenceUI/Icon';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { Switch } from '@ValenceUI/Switch';
import { isSubscribableEvent } from '@ValenceContracts/schemas/Webhook';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { NewWebhookDialog } from './components/NewWebhookDialog/NewWebhookDialog';
import { WebhookPage } from './components/WebhookPage/WebhookPage';
import { WEBHOOK_SERVICE_NAMES } from './WEBHOOK_SERVICE_NAMES';
import { lastDeliveryOf } from './lastDeliveryOf';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { WebhookSubscription } from '@ValenceContracts/schemas/Webhook';
import type { WebhooksPanelProps } from './WebhooksPanel.types';
import { PanelCard } from '@ValenceUI/PanelCard';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { useAdminCommand } from '@ValenceScreens/admin/useAdminCommand';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * The webhooks: a table of them, each opening onto a page of its own where it is set up, tested and
 * its deliveries read. A new one is started with only its service and address.
 *
 * @param props - See {@link WebhooksPanelProps}.
 */
const WebhooksPanel = ({
  webhooks,
  isReading = false,
  isUnreachable = false,
  isReadingAgain = false,
  onReadAgain,
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
  openedWebhook,
  onOpenWebhook,
}: WebhooksPanelProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [localOpened, setLocalOpened] = useState<string | null>(null);
  const openedId = onOpenWebhook === undefined ? localOpened : (openedWebhook ?? null);
  const open = onOpenWebhook ?? setLocalOpened;

  useAdminCommand('createWebhook', () => {
    setIsAdding(true);
  });
  const [deleting, setDeleting] = useState<WebhookSubscription | null>(null);
  const now = useTicking(A_CAPTION_AGES_EVERY);

  useEffect(() => {
    if (openedId !== openHistoryId) {
      onOpenHistory(openedId);
    }
  }, [openedId, openHistoryId, onOpenHistory]);

  const [shownCreated, setShownCreated] = useState<string | null>(null);

  useEffect(() => {
    if (created !== null && created.id !== shownCreated) {
      setShownCreated(created.id);
      open(created.id);
    }
  }, [created, shownCreated, open]);

  const opened = webhooks.find((webhook) => webhook.id === openedId) ?? null;

  const deleteDialog = (
    <ConfirmDialog
      title={
        deleting === null
          ? say('screens.adminArea.webhooksPanel.deleteThisWebhook')
          : say('common.deleteName', { name: deleting.name })
      }
      detail={say('screens.adminArea.webhooksPanel.nothingMoreWillBeSentThere')}
      confirmLabel={say('common.delete')}
      isDestructive
      isOpen={deleting !== null}
      onClose={() => {
        setDeleting(null);
      }}
      onConfirm={() => {
        if (deleting !== null) {
          onDelete(deleting.id);
          open(null);
        }

        setDeleting(null);
      }}
    />
  );

  if (opened !== null) {
    return (
      <>
        {deleteDialog}
        <WebhookPage
          webhook={opened}
          created={created !== null && created.id === opened.id ? created : null}
          deliveries={deliveries}
          isHistoryLoading={isHistoryLoading}
          accounts={accounts}
          profiles={profiles}
          hasRequests={hasRequests}
          onBack={() => {
            open(null);
          }}
          onEdit={onEdit}
          onSetEnabled={(enabled) => {
            onSetEnabled(opened.id, enabled);
          }}
          onTest={() => {
            onTest(opened.id);
          }}
          onDelete={() => {
            setDeleting(opened);
          }}
          onRedeliver={(deliveryId) => {
            onRedeliver(opened.id, deliveryId);
          }}
          onDismissCreated={onDismissCreated}
        />
      </>
    );
  }

  const columns: DataTableColumn<WebhookSubscription>[] = [
    {
      id: 'name',
      header: say('common.name'),
      accessorFn: (webhook) => webhook.name,
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-3.5 py-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-text-muted">
            {row.original.preset === 'discord' ? (
              <BrandGlyph of="discord" size={20} />
            ) : (
              <Icon of={EmptyWebhookIcon} size={18} />
            )}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[0.9375rem] font-medium text-text">
              {row.original.name}
            </span>
            <span className="max-w-[28rem] truncate text-xs text-text-muted">
              {row.original.url}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: 'service',
      header: say('screens.adminArea.bucketDialog.service'),
      accessorFn: (webhook) => WEBHOOK_SERVICE_NAMES[webhook.preset],
      cell: ({ row }) => (
        <span className="text-text-muted">{WEBHOOK_SERVICE_NAMES[row.original.preset]}</span>
      ),
    },
    {
      id: 'events',
      meta: { hidesOnPhones: true },
      header: say('screens.adminArea.webhooksPanel.sends'),
      accessorFn: (webhook) => webhook.events.filter(isSubscribableEvent).length,
      cell: ({ row }) => {
        const count = row.original.events.filter(isSubscribableEvent).length;

        return (
          <span className="tabular-nums text-text-muted">
            {sayCount('screens.observabilityPage.logExplorer.levelToggles.countEvents', count)}
          </span>
        );
      },
    },
    {
      id: 'last',
      header: say('screens.adminArea.webhooksPanel.lastDelivery'),
      accessorFn: (webhook) => webhook.lastAttemptAt ?? '',
      cell: ({ row }) => {
        const last = lastDeliveryOf(row.original);

        return (
          <span className="flex items-center gap-2">
            <Badge tone={last.tone}>{last.label}</Badge>
            {row.original.lastAttemptAt === null ? null : (
              <span className="whitespace-nowrap text-xs text-text-muted">
                {describeSince(row.original.lastAttemptAt, now)}
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: 'on',
      header: say('common.on'),
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className="flex justify-end"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <Switch
            label={say('common.enabled')}
            isLabelHidden
            isOn={row.original.enabled}
            onToggle={() => {
              onSetEnabled(row.original.id, !row.original.enabled);
            }}
          />
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <NewWebhookDialog
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
        }}
        onCreate={onCreate}
      />

      <PanelCard
        title={say('common.webhooks')}
        isFlush
        actions={
          <PanelCardAction
            icon={PlusFilledIcon}
            onClick={() => {
              setIsAdding(true);
            }}
          >
            {say('common.createWebhook')}
          </PanelCardAction>
        }
      >
        {isUnreachable ? (
          <CouldNotRead
            said={say('screens.adminArea.webhooksPanel.theWebhooksCouldNotBeRead')}
            isTryingAgain={isReadingAgain}
            onTryAgain={onReadAgain}
          />
        ) : isReading ? (
          <Spinner isCentered size="sm" label={say('common.loading')} />
        ) : webhooks.length === 0 ? (
          <NothingHere
            of={EmptyWebhookIcon}
            title={say('screens.adminArea.webhooksPanel.noWebhooksYetCreateOne')}
            isCompact
          />
        ) : (
          <DataTable
            label={say('common.webhooks')}
            columns={columns}
            rows={webhooks}
            getRowId={(webhook) => webhook.id}
            onChooseRow={(webhook) => {
              open(webhook.id);
            }}
          />
        )}
      </PanelCard>
    </div>
  );
};

WebhooksPanel.displayName = 'WebhooksPanel';

export { WebhooksPanel };
