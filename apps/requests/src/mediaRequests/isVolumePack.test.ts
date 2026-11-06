import { describe, expect, it } from 'vitest';
import { isVolumePack } from './isVolumePack';

const VOLUME_ONE = { title: 'Chainsaw Man, Vol. 1' };

describe('isVolumePack', () => {
  it('takes a run of volumes that takes the volume in', () => {
    expect(
      isVolumePack(VOLUME_ONE, 'Chainsaw Man v01-20 + 187-230 (2020-2025) (Digital) (1r0n)'),
    ).toBe(true);
    expect(isVolumePack(VOLUME_ONE, 'Chainsaw Man v12-20 (Digital)')).toBe(false);
  });

  it('takes the volume on its own, and the whole series', () => {
    expect(isVolumePack(VOLUME_ONE, 'Chainsaw Man v01 (Digital)')).toBe(true);
    expect(isVolumePack(VOLUME_ONE, 'Chainsaw Man Complete Collection (Digital)')).toBe(true);
  });

  it('refuses chapters, music and another series', () => {
    expect(isVolumePack(VOLUME_ONE, 'Chainsaw Man 232 (2026)')).toBe(false);
    expect(isVolumePack(VOLUME_ONE, 'Chainsaw Man Original Soundtrack EP Vol 1 Mp3 320kbps')).toBe(
      false,
    );
    expect(isVolumePack(VOLUME_ONE, 'Vagabond v01-37 (Digital)')).toBe(false);
  });

  it('is never one for a book that names no volume', () => {
    expect(isVolumePack({ title: 'Atomic Habits' }, 'Atomic Habits Complete Collection')).toBe(
      false,
    );
  });
});
