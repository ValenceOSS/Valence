import type { HardwareDeviceSetting } from '@ValenceContracts/schemas/DevicePlacement';
import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';

type DeviceRowProps = {
  device: PlacedDevice;
  isFirst: boolean;
  isLast: boolean;
  onChange: (setting: HardwareDeviceSetting) => void;
  onMove: (by: -1 | 1) => void;
};

export type { DeviceRowProps };
