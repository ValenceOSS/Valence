import { sayAgain } from '@ValenceI18n/sayAgain';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
import { DoorOpen as DoorOpenFilledIcon } from '@keyline-icons/react/fill';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { Spinner } from '@ValenceUI/Spinner';
import { endDevice, endOtherDevices, fetchDevices } from '@ValenceClient/account/fetchDevices';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Device } from '@ValenceClient/account/fetchDevices';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Everywhere this account is signed in — each device, when it was last used, and a way to end it.
 * This session is marked as this one so nobody ends it by accident, and there is one gesture for
 * ending every other at once.
 */
const DeviceList = () => {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [ending, setEnding] = useState<Device | null>(null);
  const [isEndingRest, setIsEndingRest] = useState(false);

  const read = useCallback(() => {
    void fetchDevices().then(setDevices);
  }, []);

  useEffect(read, [read]);

  const elsewhere = (devices ?? []).filter((device) => !device.isCurrent);

  const columns = useMemo<DataTableColumn<Device>[]>(
    () => [
      {
        id: 'name',
        header: say('common.device'),
        accessorFn: (device) => sayAgain(device.name),
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-text">{sayAgain(row.original.name)}</span>

              {!row.original.isCurrent ? null : (
                <Badge size="sm" tone="accent">
                  {say('screens.accountArea.deviceList.thisOne')}
                </Badge>
              )}
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
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.isCurrent ? null : (
            <span className="flex justify-end">
              <ActionMenu
                label={say('common.actionsForName', { name: sayAgain(row.original.name) })}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={[
                  {
                    items: [
                      {
                        id: 'end',
                        label: say('common.signThisOut'),
                        icon: <Icon of={DoorOpenFilledIcon} size={15} />,
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
    <PanelCard
      title={say('common.devices')}
      isFlush
      actions={
        elsewhere.length === 0 ? undefined : (
          <PanelCardAction
            icon={DoorOpenFilledIcon}
            onClick={() => {
              setIsEndingRest(true);
            }}
          >
            {say('common.signOutEverywhereElse')}
          </PanelCardAction>
        )
      }
    >
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
            void endDevice(device.id).then(read);
          }
        }}
      />

      <ConfirmDialog
        title={say('common.signOutEverywhereElse2')}
        detail={sayCount(
          'screens.accountArea.deviceList.countOtherDevicesWillBeSigned',
          elsewhere.length,
        )}
        confirmLabel={say('common.signThemOut')}
        isDestructive
        isBusy={isWorking}
        isOpen={isEndingRest}
        onClose={() => {
          setIsEndingRest(false);
        }}
        onConfirm={() => {
          setIsWorking(true);

          void endOtherDevices().then(() => {
            setIsWorking(false);
            setIsEndingRest(false);
            read();
          });
        }}
      />

      {devices === null ? (
        <Spinner
          isCentered
          label={say('screens.accountArea.deviceList.readingYourDevices')}
          size="sm"
        />
      ) : (
        <DataTable
          label={say('screens.accountArea.deviceList.whereYouAreSignedIn')}
          columns={columns}
          rows={devices}
          emptyMessage={say('screens.accountArea.deviceList.nothingIsSignedInWhichCannot')}
        />
      )}
    </PanelCard>
  );
};

DeviceList.displayName = 'DeviceList';

export { DeviceList };
