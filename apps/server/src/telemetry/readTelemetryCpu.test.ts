import { describe, expect, it } from 'vitest';
import { readTelemetryCpu } from './readTelemetryCpu';

describe('readTelemetryCpu', () => {
  it('names the processor by its first core and counts the cores', () => {
    const core = { model: 'AMD Ryzen 7 9800X3D 8-Core Processor   ' };

    expect(readTelemetryCpu([core, core, core, core])).toEqual({
      model: 'AMD Ryzen 7 9800X3D 8-Core Processor',
      cores: 4,
    });
  });

  it('closes up the runs of spaces some processors pad their names with', () => {
    expect(readTelemetryCpu([{ model: 'Intel(R)  Core(TM)   i5' }]).model).toBe(
      'Intel(R) Core(TM) i5',
    );
  });

  it('still counts one core where Node sees none', () => {
    expect(readTelemetryCpu([])).toEqual({ model: '', cores: 1 });
  });

  it('cuts a long name to the length the report allows', () => {
    expect(readTelemetryCpu([{ model: 'x'.repeat(300) }]).model).toHaveLength(120);
  });
});
