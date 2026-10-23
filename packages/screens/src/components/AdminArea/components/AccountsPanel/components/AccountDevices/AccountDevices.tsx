import { sayAgain } from '@ValenceI18n/sayAgain';
import { useCallback, useMemo, useState } from 'react';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { deviceColumns } from '@ValenceScreens/session/deviceColumns';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { endAccountSession } from '@ValenceClient/admin/fetchAccountSessions';
import type { AccountSession } from '@ValenceClient/admin/fetchAccountSessions';
import type { AccountDevicesProps } from './AccountDevices.types';
import { say } from '@ValenceI18n/say';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';

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

  const columns = useMemo(() => deviceColumns<AccountSession>(setEnding), []);

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog
        title={say('common.signThisDeviceOut')}
        detail={
          ending === null
            ? ''
            : say('common.nameWillBeSignedOutAnd', { name: sayAgain(ending.name) })
        }
        confirmLabel={say('common.signItOut')}
        isDestructive
        isOpen={ending !== null}
        onClose={() => {
          setEnding(null);
        }}
        onConfirm={() => {
          const device = ending;

          setEnding(null);

          if (device !== null) {
            void endAccountSession(accountId, device.id).then(async (refusal) => {
              const isEnded = tellOutcome(
                say('screens.accountsPanel.accountDevices.nameIsSignedOut', {
                  name: sayAgain(device.name),
                }),
                failureOfRefusal(refusal),
              );

              if (isEnded) {
                await reload();
              }
            });
          }
        }}
      />

      {asked.isError ? (
        <CouldNotRead
          said={say(
            'screens.accountsPanel.accountDevices.whereThisAccountIsSignedInCouldNotBeRead',
          )}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : (
        <DataTable
          label={say('screens.accountArea.deviceList.whereYouAreSignedIn')}
          columns={columns}
          rows={sessions}
          emptyMessage={say('screens.accountsPanel.accountDevices.thisAccountIsNotSignedIn')}
        />
      )}
    </div>
  );
};

AccountDevices.displayName = 'AccountDevices';

export { AccountDevices };
