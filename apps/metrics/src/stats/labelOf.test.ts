import { describe, expect, it } from 'vitest';
import { labelOf } from './labelOf';

describe('labelOf', () => {
  it('names a group the way the page shows it', () => {
    expect(labelOf('platform', 'darwin')).toBe('macOS');
    expect(labelOf('memory', '128+')).toBe('128 GB or more');
    expect(labelOf('accel', 'qsv')).toBe('Intel Quick Sync');
  });

  it('calls every kind of other Other', () => {
    expect(labelOf('platform', 'other')).toBe('Other');
  });

  it('keeps the id where a group has no name of its own', () => {
    expect(labelOf('accel', 'mediacodec')).toBe('mediacodec');
  });
});
