import { useState } from 'react';
import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { orderDevices } from '@ValenceContracts/functions/orderDevices';
import { WhenDevicesFullSchema } from '@ValenceContracts/schemas/DevicePlacement';
import type { HardwareDeviceSetting } from '@ValenceContracts/schemas/DevicePlacement';
import { saveDevicePlacement } from '@ValenceClient/admin/saveDevicePlacement';
import type { DevicePlacementChange } from '@ValenceClient/admin/saveDevicePlacement';
import { failureOfAnswer } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { say } from '@ValenceI18n/say';
import { DeviceRow } from './components/DeviceRow/DeviceRow';
import type { DevicePlacementProps } from './DevicePlacement.types';

const WHEN_FULL_CHOICES = [
  {
    id: 'software',
    label: say('screens.adminArea.devicePlacement.encodeInSoftware'),
  },
  {
    id: 'preferred',
    label: say('screens.adminArea.devicePlacement.putItOnTheFirstDevice'),
  },
];

/**
 * The settings for spreading streams across more than one graphics device: whether to, which
 * devices in which order and how many streams each may take, and what happens once all are full.
 * With a single device there is nothing to spread, and it says so.
 *
 * @param overview - What the server reports about itself, or null before it has answered.
 * @param devices - The devices the media service found, most preferred first, or null before it
 *   has answered.
 * @param onSaved - Called once a change has been written.
 */
const DevicePlacement = ({ overview, devices, onSaved }: DevicePlacementProps) => {
  const [isSpread, setIsSpread] = useState(overview?.settings.spreadAcrossDevices ?? false);
  const [whenFull, setWhenFull] = useState(overview?.settings.whenDevicesFull ?? 'software');
  const [chosen, setChosen] = useState<HardwareDeviceSetting[] | null>(null);

  if (devices === null || devices.length === 0) {
    return null;
  }

  if (devices.length === 1) {
    return (
      <SettingRow
        title={say('screens.adminArea.graphicsDevices')}
        description={say('screens.adminArea.devicePlacement.onlyOneFound')}
      />
    );
  }

  const shown = chosen === null ? devices : orderDevices(devices, chosen);
  const settings = shown.map(({ id, isOn, maxStreams }) => ({ id, isOn, maxStreams }));

  const save = (change: DevicePlacementChange, undo: () => void) => {
    void saveDevicePlacement(change).then((saved) => {
      tellOutcome(
        say('screens.adminArea.devicePlacement.saved'),
        failureOfAnswer(saved, say('screens.adminArea.devicePlacement.couldNotBeSaved')),
      );

      if (saved) {
        onSaved?.();

        return;
      }

      undo();
    });
  };

  const changeDevices = (next: HardwareDeviceSetting[]) => {
    const before = chosen;

    setChosen(next);
    save({ hardwareDevices: next }, () => {
      setChosen(before);
    });
  };

  return (
    <>
      <SettingRow
        title={say('screens.adminArea.devicePlacement.useMoreThanOne')}
        description={say('screens.adminArea.devicePlacement.useMoreThanOneDetail')}
      >
        <Switch
          label={say('screens.adminArea.devicePlacement.useMoreThanOne')}
          isLabelHidden
          isOn={isSpread}
          onToggle={() => {
            const next = !isSpread;

            setIsSpread(next);
            save({ spreadAcrossDevices: next }, () => {
              setIsSpread(!next);
            });
          }}
        />
      </SettingRow>

      {isSpread ? (
        <>
          {shown.map((device, index) => (
            <DeviceRow
              key={device.id}
              device={device}
              isFirst={index === 0}
              isLast={index === shown.length - 1}
              onChange={(setting) => {
                changeDevices(settings.map((one) => (one.id === setting.id ? setting : one)));
              }}
              onMove={(by) => {
                const next = [...settings];
                const moving = next[index];
                const swapped = next[index + by];

                if (moving === undefined || swapped === undefined) {
                  return;
                }

                next[index] = swapped;
                next[index + by] = moving;
                changeDevices(next);
              }}
            />
          ))}

          <SettingRow
            title={say('screens.adminArea.devicePlacement.whenEveryDeviceIsFull')}
            description={say('screens.adminArea.devicePlacement.whenEveryDeviceIsFullDetail')}
          >
            <OptionMenu
              label={say('screens.adminArea.devicePlacement.whenEveryDeviceIsFull')}
              groups={[
                {
                  name: say('screens.adminArea.devicePlacement.whenEveryDeviceIsFull'),
                  selectedId: whenFull,
                  onSelect: (id) => {
                    const picked = WhenDevicesFullSchema.safeParse(id);

                    if (!picked.success) {
                      return;
                    }

                    const before = whenFull;

                    setWhenFull(picked.data);
                    save({ whenDevicesFull: picked.data }, () => {
                      setWhenFull(before);
                    });
                  },
                  options: WHEN_FULL_CHOICES,
                },
              ]}
              trigger={
                <>
                  <span className="truncate">
                    {WHEN_FULL_CHOICES.find((choice) => choice.id === whenFull)?.label}
                  </span>

                  <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
                </>
              }
              triggerShape="field"
              align="end"
              className="w-56 max-w-full"
            />
          </SettingRow>
        </>
      ) : null}
    </>
  );
};

DevicePlacement.displayName = 'DevicePlacement';

export { DevicePlacement };
