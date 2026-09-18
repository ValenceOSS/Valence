import { describe, expect, it } from 'vitest';
import { projectDiskAfter } from './projectDiskAfter';

const candidates = [
  { sizeBytes: 70_000_000_000, estimatedBytes: 6_000_000_000 },
  { sizeBytes: 30_000_000_000, estimatedBytes: 4_000_000_000 },
];

describe('projectDiskAfter', () => {
  it('sums what is held now', () => {
    expect(projectDiskAfter(candidates, 'replace').nowBytes).toBe(100_000_000_000);
  });

  it('frees disk when the encode takes the original place', () => {
    const { nowBytes, afterBytes } = projectDiskAfter(candidates, 'replace');

    expect(afterBytes).toBe(10_000_000_000);
    expect(afterBytes).toBeLessThan(nowBytes);
  });

  it('costs disk when the encode sits beside the original, which is the opposite trade', () => {
    const { nowBytes, afterBytes } = projectDiskAfter(candidates, 'keep');

    expect(afterBytes).toBe(110_000_000_000);
    expect(afterBytes).toBeGreaterThan(nowBytes);
  });

  it('frees disk for audio-only work too, since it replaces the file', () => {
    expect(projectDiskAfter(candidates, 'audioOnly').afterBytes).toBe(10_000_000_000);
  });

  it('counts a file nothing could be estimated for at what it costs now', () => {
    const unknown = [{ sizeBytes: 5_000_000_000, estimatedBytes: null }];

    expect(projectDiskAfter(unknown, 'replace').afterBytes).toBe(5_000_000_000);
    expect(projectDiskAfter(unknown, 'keep').afterBytes).toBe(5_000_000_000);
  });

  it('answers nothing held and nothing after for nothing chosen', () => {
    expect(projectDiskAfter([], 'replace')).toEqual({ nowBytes: 0, afterBytes: 0 });
  });
});
