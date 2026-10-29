import type {
  HardwareDeviceSetting,
  WhenDevicesFull,
} from '@ValenceContracts/schemas/DevicePlacement';

type DevicePlacementChange = {
  spreadAcrossDevices?: boolean;
  hardwareDevices?: HardwareDeviceSetting[];
  whenDevicesFull?: WhenDevicesFull;
};

/**
 * Changes how streams are spread across graphics devices: whether they are, which devices in
 * which order and how many streams each may take, and what happens once every one is full.
 *
 * @param change - The parts to change; the rest are left as they are.
 * @returns Whether the change was written.
 */
const saveDevicePlacement = async (change: DevicePlacementChange): Promise<boolean> => {
  const response = await fetch('/api/admin/settings', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(change),
  }).catch(() => null);

  return response !== null && response.ok;
};

export type { DevicePlacementChange };

export { saveDevicePlacement };
