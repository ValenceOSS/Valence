import { cn } from '@ValenceUI/cn';
import { GROUP_LABEL } from '@ValenceUI/tokens/GROUP_LABEL';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { shortDeviceName } from '@ValenceScreens/admin/shortDeviceName';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { loadOfDevice } from './loadOfDevice';
import type { DeviceLoadListProps } from './DeviceLoadList.types';

/**
 * Every graphics device streams are spread across: how many streams each is encoding, out of how
 * many it can, and a bar of how busy it is.
 *
 * @param devices - The devices, most preferred first.
 */
const DeviceLoadList = ({ devices }: DeviceLoadListProps) => (
  <>
    <span className={cn('block px-2.5 pb-0.5 pt-1', GROUP_LABEL)}>
      {say('screens.adminArea.graphicsDevices')}
    </span>

    <ul className="flex flex-col">
      {devices.map((device) => (
        <li key={device.id} className="flex flex-col gap-1.5 rounded-md px-2.5 py-1.5">
          <span className="flex items-baseline justify-between gap-3">
            <span className="truncate font-medium text-text">{shortDeviceName(device.name)}</span>

            <span className="shrink-0 text-xs tabular-nums text-text-muted">
              {device.capacity > 0
                ? sayCount('screens.adminArea.deviceLoadList.streamsOfCapacity', device.capacity, {
                    streams: device.streams.toString(),
                  })
                : sayCount('screens.adminArea.deviceLoadList.streams', device.streams)}
            </span>
          </span>

          <ProgressBar label={device.name} value={loadOfDevice(device)} max={100} isThin isFull />
        </li>
      ))}
    </ul>
  </>
);

DeviceLoadList.displayName = 'DeviceLoadList';

export { DeviceLoadList };
