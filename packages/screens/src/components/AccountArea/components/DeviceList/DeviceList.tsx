import { sayAgain } from '@ValenceI18n/sayAgain';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { PanelCard } from '@ValenceUI/PanelCard';
import { LogOut as LogOutFilledIcon } from '@keyline-icons/react/fill';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { deviceColumns } from '@ValenceScreens/session/deviceColumns';
import { Spinner } from '@ValenceUI/Spinner';
import { endDevice, endOtherDevices, fetchDevices } from '@ValenceClient/account/fetchDevices';
import type { Device } from '@ValenceClient/account/fetchDevices';
import { say } from '@ValenceI18n/say';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Everywhere this account is signed in — each device, when it was last used, and a way to end it.
 * This session is marked as this one so nobody ends it by accident, and there is one gesture for
 * ending every other at once. A shared demo account sees where it is signed in but ends nothing, since
 * the devices it would end are other visitors'.
 */
const DeviceList = () => {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [ending, setEnding] = useState<Device | null>(null);
  const [isEndingRest, setIsEndingRest] = useState(false);
  const { isDemo } = useWhatIMayDo();

  const read = useCallback(() => {
    void fetchDevices().then(setDevices);
  }, []);

  useEffect(read, [read]);

  const elsewhere = (devices ?? []).filter((device) => !device.isCurrent);

  const columns = useMemo(() => deviceColumns<Device>(isDemo ? null : setEnding), [isDemo]);

  return (
    <PanelCard
      title={say('common.devices')}
      isFlush
      actions={
        elsewhere.length === 0 || isDemo ? undefined : (
          <PanelCardAction
            icon={LogOutFilledIcon}
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
