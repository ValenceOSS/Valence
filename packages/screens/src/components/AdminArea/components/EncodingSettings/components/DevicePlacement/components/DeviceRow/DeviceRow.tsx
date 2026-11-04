import { useEffect, useRef, useState } from 'react';
import { ChevronDown as ChevronDownIcon, ChevronUp as ChevronUpIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { MOST_STREAMS_PER_DEVICE } from '@ValenceContracts/schemas/DevicePlacement';
import { nameOfAccel } from '@ValenceScreens/admin/nameOfAccel';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { readMostStreams } from './readMostStreams';
import type { DeviceRowProps } from './DeviceRow.types';

const SAVES_AFTER_MS = 800;

/**
 * One graphics device streams may be placed on: what drives it, whether it is switched on, how
 * many streams it may take, and buttons to make it more or less preferred.
 *
 * @param device - The device, as found and as saved.
 * @param isFirst - Whether it is the most preferred, so it cannot move up.
 * @param isLast - Whether it is the least preferred, so it cannot move down.
 * @param onChange - Told what the device is now set to.
 * @param onMove - Told to move the device up or down the order.
 */
const DeviceRow = ({ device, isFirst, isLast, onChange, onMove }: DeviceRowProps) => {
  const [mostStreams, setMostStreams] = useState(device.maxStreams?.toString() ?? '');
  const saving = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMostStreams(device.maxStreams?.toString() ?? '');
  }, [device.maxStreams]);

  useEffect(
    () => () => {
      if (saving.current !== null) {
        clearTimeout(saving.current);
      }
    },
    [],
  );

  const encoders = device.probed
    ? sayCount('screens.adminArea.devicePlacement.encodersChecked', device.encoders.length)
    : say('screens.adminArea.devicePlacement.encodersNotChecked');

  return (
    <SettingRow
      title={device.name}
      description={
        device.accels.length === 0
          ? encoders
          : say('screens.adminArea.devicePlacement.deviceSummary', {
              accels: device.accels.map((accel) => nameOfAccel(accel)).join(', '),
              encoders,
            })
      }
    >
      <span className="text-xs text-text-muted">
        {say('screens.adminArea.devicePlacement.mostStreams')}
      </span>

      <TextField
        label={say('screens.adminArea.devicePlacement.mostStreamsOn', { device: device.name })}
        isLabelHidden
        type="number"
        inputMode="numeric"
        min={1}
        max={MOST_STREAMS_PER_DEVICE}
        size="sm"
        className="w-20"
        value={mostStreams}
        placeholder={device.capacity > 0 ? device.capacity.toString() : say('common.noLimit')}
        onValueChange={(typed) => {
          setMostStreams(typed);

          if (saving.current !== null) {
            clearTimeout(saving.current);
          }

          const read = readMostStreams(typed);

          if (read === undefined || read === device.maxStreams) {
            return;
          }

          saving.current = setTimeout(() => {
            saving.current = null;
            onChange({ id: device.id, isOn: device.isOn, maxStreams: read });
          }, SAVES_AFTER_MS);
        }}
      />

      <Button
        variant="subtle"
        size="sm"
        isIconOnly
        label={say('screens.adminArea.devicePlacement.moveDeviceUp', { device: device.name })}
        disabled={isFirst}
        onClick={() => {
          onMove(-1);
        }}
      >
        <Icon of={ChevronUpIcon} size={15} />
      </Button>

      <Button
        variant="subtle"
        size="sm"
        isIconOnly
        label={say('screens.adminArea.devicePlacement.moveDeviceDown', { device: device.name })}
        disabled={isLast}
        onClick={() => {
          onMove(1);
        }}
      >
        <Icon of={ChevronDownIcon} size={15} />
      </Button>

      <Switch
        label={say('screens.adminArea.devicePlacement.useDevice', { device: device.name })}
        isLabelHidden
        isOn={device.isOn}
        onToggle={() => {
          onChange({ id: device.id, isOn: !device.isOn, maxStreams: device.maxStreams });
        }}
      />
    </SettingRow>
  );
};

DeviceRow.displayName = 'DeviceRow';

export { DeviceRow };
