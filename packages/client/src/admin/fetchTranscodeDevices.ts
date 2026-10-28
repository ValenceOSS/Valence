import { readFromServer } from '@ValenceClient/query/readFromServer';
import { PlacedDeviceSchema } from '@ValenceContracts/schemas/TranscodeDevice';
import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';
import { z } from 'zod';

const PlacedDevicesSchema = z.object({ devices: z.array(PlacedDeviceSchema) });

/**
 * Reads the graphics devices the media service can place streams on, most preferred first.
 *
 * @returns Every device found, with whether it is switched on, how many streams it may take and
 *   how busy it is.
 */
const fetchTranscodeDevices = async (): Promise<PlacedDevice[]> =>
  (await readFromServer('/api/admin/hardware/devices', PlacedDevicesSchema)).devices;

export { fetchTranscodeDevices };
