import { describe, expect, it } from 'vitest';
import { HardwareSchema } from './Hardware';

const reading = {
  surroundings: 'container',
  processor: { model: 'Ryzen 9', cores: 8, threads: 16, speedMhz: 4900 },
  memory: { totalBytes: 1024, modules: [] },
  drives: [{ name: 'sda', model: null, kind: 'hdd', connection: 'SATA', totalBytes: 2048 }],
};

describe('HardwareSchema', () => {
  it('reads what the media service says the machine is built from', () => {
    expect(HardwareSchema.parse(reading).processor?.model).toBe('Ryzen 9');
  });

  it('reads a processor without core groups as having none', () => {
    expect(HardwareSchema.parse(reading).processor?.groups).toEqual([]);
  });

  it('refuses a drive of a kind it does not know', () => {
    expect(
      HardwareSchema.safeParse({ ...reading, drives: [{ ...reading.drives[0], kind: 'tape' }] })
        .success,
    ).toBe(false);
  });
});
