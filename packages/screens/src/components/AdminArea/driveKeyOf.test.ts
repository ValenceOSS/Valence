import { describe, expect, it } from 'vitest';
import { driveKeyOf } from './driveKeyOf';

const at = (mountPoint: string, device?: string) => ({
  mountPoint,
  device: device ?? null,
  totalBytes: 100,
  availableBytes: 50,
});

describe('driveKeyOf', () => {
  it('names a ZFS dataset by its pool', () => {
    expect(driveKeyOf(at('/media', 'tank/media'))).toBe('zfs:tank');
    expect(driveKeyOf(at('/config', 'tank/apps/docker'))).toBe('zfs:tank');
  });

  it('names a disk by where it is mounted', () => {
    expect(driveKeyOf(at('/media', '/dev/sda1'))).toBe('/media');
    expect(driveKeyOf(at('/', 'overlay'))).toBe('/');
  });

  it('does not take a network share for a pool', () => {
    expect(driveKeyOf(at('/media', 'nas:/volume1/media'))).toBe('/media');
    expect(driveKeyOf(at('/media', '//nas/media'))).toBe('/media');
  });

  it('names a disk by where it is mounted where the device is not known', () => {
    expect(driveKeyOf(at('/media'))).toBe('/media');
  });
});
