import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';
import type { TranscodeDevice } from '@ValenceContracts/schemas/TranscodeDevice';

const MOST_LISTED = 16;

const MODEL_LENGTH = 120;

const ACCEL_LENGTH = 32;

const QUALCOMM_WORDS = ['qualcomm', 'adreno', 'snapdragon'];

type GraphicsReading = {
  devices: readonly TranscodeDevice[];
  accels: readonly string[];
};

/**
 * Names a device's maker as an anonymous report does, which tells Qualcomm's apart from the other
 * makers the media service does not name.
 *
 * @param device - The device the media service found.
 * @returns Its maker, for the report.
 */
const vendorOf = (device: TranscodeDevice): TelemetryReport['gpus'][number]['vendor'] => {
  const name = device.name.toLowerCase();

  return device.vendor === 'other' && QUALCOMM_WORDS.some((word) => name.includes(word))
    ? 'qualcomm'
    : device.vendor;
};

/**
 * Says which graphics devices the media service found and which hardware encoders it proved work,
 * as an anonymous report carries them: each device's maker and model, and each backend once.
 *
 * @param reading - The devices and the proved backends, as the media service told them.
 * @returns The graphics, for the report.
 */
const readTelemetryGraphics = ({
  devices,
  accels,
}: GraphicsReading): Pick<TelemetryReport, 'gpus' | 'accels'> => ({
  gpus: devices.slice(0, MOST_LISTED).map((device) => ({
    vendor: vendorOf(device),
    model: device.name.trim().slice(0, MODEL_LENGTH),
  })),
  accels: [
    ...new Set(
      accels.map((accel) => accel.trim().slice(0, ACCEL_LENGTH)).filter((accel) => accel !== ''),
    ),
  ].slice(0, MOST_LISTED),
});

export { readTelemetryGraphics };
