import { describe, expect, it } from 'vitest';
import { TranscodeDeviceSchema } from '@ValenceContracts/schemas/TranscodeDevice';
import { readTelemetryGraphics } from './readTelemetryGraphics';

/**
 * A graphics device as the media service lists one.
 *
 * @param name - What it is called.
 * @param vendor - Who made it.
 * @returns The device.
 */
const aDevice = (name: string, vendor: 'nvidia' | 'amd' | 'intel' | 'apple' | 'other') =>
  TranscodeDeviceSchema.parse({ id: name, name, vendor });

describe('readTelemetryGraphics', () => {
  it('lists each device by maker and model, and each proved backend once', () => {
    expect(
      readTelemetryGraphics({
        devices: [aDevice('GeForce RTX 5080', 'nvidia'), aDevice('Arc A380', 'intel')],
        accels: ['nvenc', 'qsv', 'nvenc'],
      }),
    ).toEqual({
      gpus: [
        { vendor: 'nvidia', model: 'GeForce RTX 5080' },
        { vendor: 'intel', model: 'Arc A380' },
      ],
      accels: ['nvenc', 'qsv'],
    });
  });

  it('knows a Qualcomm device the media service could not name the maker of', () => {
    expect(
      readTelemetryGraphics({ devices: [aDevice('Adreno 750', 'other')], accels: [] }).gpus,
    ).toEqual([{ vendor: 'qualcomm', model: 'Adreno 750' }]);
  });

  it('says nothing where the media service found nothing', () => {
    expect(readTelemetryGraphics({ devices: [], accels: [] })).toEqual({ gpus: [], accels: [] });
  });

  it('lists no more than the report allows', () => {
    const many = Array.from({ length: 20 }, (_, at) => aDevice(`Card ${at.toString()}`, 'amd'));

    expect(readTelemetryGraphics({ devices: many, accels: [] }).gpus).toHaveLength(16);
  });
});
