import { LogOut as LogOutFilledIcon, PenLine as PenLineIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Icon } from '@ValenceUI/Icon';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import type { ReadDevice } from '@ValenceContracts/schemas/SignedInDevice';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { WORDMARKS, marksOfDevice } from '@ValenceScreens/devices/marksOfDevice';
import { namesOfSignedInDevice } from '@ValenceClient/account/namesOfSignedInDevice';
import { say } from '@ValenceI18n/say';

type DeviceActions<Row> = {
  onEnd: ((device: Row) => void) | null;
  onRename?: ((device: Row) => void) | null;
};

/**
 * The columns of a list of where an account is signed in, the same in the account's own devices and
 * in an administrator's view of somebody else's: the device, what it reaches Valence through and
 * where it was, when it was last used, when it signed in, and a menu to rename it or sign it out. The
 * device this list is open on is marked, and cannot be signed out from it; one in use right now says
 * so in place of when it was last used.
 *
 * @param actions - Told which device somebody asked to sign out or rename, or nothing where nobody
 * may.
 * @returns The columns.
 */
const deviceColumns = <Row extends ReadDevice>({
  onEnd,
  onRename = null,
}: DeviceActions<Row>): DataTableColumn<Row>[] => [
  {
    id: 'name',
    header: say('common.device'),
    accessorFn: (device) => namesOfSignedInDevice(device).device,
    cell: ({ row }) => {
      const { device, client } = namesOfSignedInDevice(row.original);
      const { deviceGlyph, systemMark, clientGlyph, clientMark } = marksOfDevice(
        row.original.identity,
      );

      return (
        <span className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-[var(--surface-hover)] text-text-muted">
            {systemMark === null || WORDMARKS.has(systemMark) ? (
              <Icon of={deviceGlyph} size={16} />
            ) : (
              <BrandGlyph of={systemMark} size={16} />
            )}
          </span>

          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className="min-w-0 truncate font-medium text-text"
                title={row.original.userAgent ?? undefined}
              >
                {device}
              </span>

              {row.original.isCurrent ? (
                <Badge size="sm" tone="accent">
                  {say('common.thisDevice')}
                </Badge>
              ) : null}
            </span>

            {client === null ? null : (
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
                {clientMark === null ? (
                  <Icon of={clientGlyph} size={13} className="shrink-0" />
                ) : (
                  <BrandGlyph of={clientMark} size={12} />
                )}
                <span className="truncate">{client}</span>
              </span>
            )}

            {row.original.address === null ? null : (
              <span className="truncate text-xs text-text-muted">{row.original.address}</span>
            )}
          </span>
        </span>
      );
    },
  },
  {
    id: 'lastActive',
    header: say('common.lastActive'),
    accessorFn: (device) => device.lastActiveAt ?? device.signedInAt,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-text-muted">
        {row.original.isActiveNow
          ? say('screens.adminArea.overviewPanel.activeNow')
          : (saidWhen(row.original.lastActiveAt ?? row.original.signedInAt) ?? '—')}
      </span>
    ),
  },
  {
    id: 'signedIn',
    meta: { hidesOnPhones: true },
    header: say('common.signedIn'),
    accessorFn: (device) => device.signedInAt,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-text-muted">
        {saidWhen(row.original.signedInAt) ?? '—'}
      </span>
    ),
  },
  ...(onEnd === null && onRename === null
    ? []
    : [
        {
          id: 'act',
          header: '',
          enableSorting: false,
          cell: ({ row }) => {
            const items = [
              ...(onRename === null
                ? []
                : [
                    {
                      id: 'rename',
                      label: say('common.rename'),
                      icon: <Icon of={PenLineIcon} size={15} />,
                      onChoose: () => {
                        onRename(row.original);
                      },
                    },
                  ]),
              ...(onEnd === null || row.original.isCurrent
                ? []
                : [
                    {
                      id: 'end',
                      label: say('common.signThisOut'),
                      icon: <Icon of={LogOutFilledIcon} size={15} />,
                      isDestructive: true,
                      onChoose: () => {
                        onEnd(row.original);
                      },
                    },
                  ]),
            ];

            return items.length === 0 ? null : (
              <span className="flex justify-end">
                <ActionMenu
                  label={say('common.actionsForName', {
                    name: namesOfSignedInDevice(row.original).device,
                  })}
                  groups={[{ items }]}
                />
              </span>
            );
          },
        } satisfies DataTableColumn<Row>,
      ]),
];

export { deviceColumns };
