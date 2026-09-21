import { Icon } from '@ValenceUI/Icon';
import {
  DoorOpen as DoorOpenIcon,
  MoreHorizontal as MoreHorizontalIcon,
} from '@keyline-icons/react';
import { useCallback, useMemo, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { endAccountSession } from '@ValenceClient/admin/fetchAccountSessions';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { AccountSession } from '@ValenceClient/admin/fetchAccountSessions';
import type { AccountDevicesProps } from './AccountDevices.types';

/**
 * Everywhere one account is signed in, for an administrator reviewing it rather than the account
 * itself — there is no session marked as "this one," since the administrator is not signed in as
 * them. Signing out everywhere at once lives on the Security tab beside resetting the password,
 * since both end every session; this is for ending one that looks wrong on its own.
 *
 * @param accountId - The account being reviewed.
 */
const AccountDevices = ({ accountId }: AccountDevicesProps) => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.accountSessions(accountId));
  const sessions = asked.data ?? [];
  const [ending, setEnding] = useState<AccountSession | null>(null);

  const reload = useCallback(
    () => cache.invalidateQueries({ queryKey: adminQueries.accountSessions(accountId).queryKey }),
    [cache, accountId],
  );

  const columns = useMemo<DataTableColumn<AccountSession>[]>(
    () => [
      {
        id: 'name',
        header: 'Device',
        accessorFn: (device) => device.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium text-text">{row.original.name}</span>

            {row.original.address === null ? null : (
              <span className="truncate text-xs text-text-muted">{row.original.address}</span>
            )}
          </span>
        ),
      },
      {
        id: 'signedIn',
        header: 'Signed in',
        accessorFn: (device) => device.signedInAt,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-text-muted">
            {saidWhen(row.original.signedInAt)}
          </span>
        ),
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end">
            <ActionMenu
              label={`Actions for ${row.original.name}`}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'end',
                      label: 'Sign this out',
                      icon: <Icon of={DoorOpenIcon} size={15} />,
                      isDestructive: true,
                      onChoose: () => {
                        setEnding(row.original);
                      },
                    },
                  ],
                },
              ]}
            />
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog
        title="Sign this device out?"
        detail={
          ending === null
            ? ''
            : `${ending.name} will be signed out and whoever is using it has to sign in again.`
        }
        confirmLabel="Sign it out"
        isDestructive
        isOpen={ending !== null}
        onClose={() => {
          setEnding(null);
        }}
        onConfirm={() => {
          const device = ending;

          setEnding(null);

          if (device !== null) {
            void endAccountSession(accountId, device.id).then(reload);
          }
        }}
      />

      {asked.isError ? (
        <CouldNotRead
          what="Where this account is signed in"
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : (
        <DataTable
          label="Where this account is signed in"
          columns={columns}
          rows={sessions}
          emptyMessage="This account is not signed in anywhere."
        />
      )}
    </div>
  );
};

AccountDevices.displayName = 'AccountDevices';

export { AccountDevices };
