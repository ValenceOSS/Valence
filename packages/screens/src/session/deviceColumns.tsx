import { LogOut as LogOutFilledIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Icon } from '@ValenceUI/Icon';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import type { AccountSession } from '@ValenceClient/admin/fetchAccountSessions';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';

type SignedInDevice = AccountSession & { isCurrent?: boolean };

/**
 * The columns of a list of where an account is signed in, the same in the account's own devices and
 * in an administrator's view of somebody else's: the device and where it was, when it signed in, and
 * a menu to sign it out. The device this list is open on is marked, and cannot be signed out from it.
 *
 * @param onEnd - Told which device somebody asked to sign out, or nothing where nobody may.
 * @returns The columns.
 */
const deviceColumns = <Row extends SignedInDevice>(
  onEnd: ((device: Row) => void) | null,
): DataTableColumn<Row>[] => [
  {
    id: 'name',
    header: say('common.device'),
    accessorFn: (device) => sayAgain(device.name),
    cell: ({ row }) => (
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium text-text">{sayAgain(row.original.name)}</span>

          {row.original.isCurrent === true ? (
            <Badge size="sm" tone="accent">
              {say('common.thisDevice')}
            </Badge>
          ) : null}
        </span>

        {row.original.address === null ? null : (
          <span className="truncate text-xs text-text-muted">{row.original.address}</span>
        )}
      </span>
    ),
  },
  {
    id: 'signedIn',
    header: say('common.signedIn'),
    accessorFn: (device) => device.signedInAt,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-text-muted">
        {saidWhen(row.original.signedInAt) ?? '—'}
      </span>
    ),
  },
  ...(onEnd === null
    ? []
    : [
        {
          id: 'act',
          header: '',
          enableSorting: false,
          cell: ({ row }) =>
            row.original.isCurrent === true ? null : (
              <span className="flex justify-end">
                <ActionMenu
                  label={say('common.actionsForName', { name: sayAgain(row.original.name) })}
                  groups={[
                    {
                      items: [
                        {
                          id: 'end',
                          label: say('common.signThisOut'),
                          icon: <Icon of={LogOutFilledIcon} size={15} />,
                          isDestructive: true,
                          onChoose: () => {
                            onEnd(row.original);
                          },
                        },
                      ],
                    },
                  ]}
                />
              </span>
            ),
        } satisfies DataTableColumn<Row>,
      ]),
];

export { deviceColumns };
