import { describe, expect, it } from 'vitest';
import { editionOptionsOf } from './editionOptionsOf';

const file = (id: string, width: number, height: number, versionLabel: string | null = null) => ({
  id,
  width,
  height,
  videoRange: 'SDR',
  durationSeconds: 3600,
  versionLabel,
});

describe('editionOptionsOf', () => {
  it('lists the title itself first, then each other version, with how sharp and long each is', () => {
    expect(
      editionOptionsOf(file('main', 3840, 2160), 'WEBDL-2160p', [
        file('bluray', 1920, 1080, 'Bluray-1080p'),
      ]),
    ).toEqual([
      { id: 'main', label: 'WEBDL-2160p', detail: '4K · 1:00:00' },
      { id: 'bluray', label: 'Bluray-1080p', detail: '1080p · 1:00:00' },
    ]);
  });

  it('calls the title itself the original where it has no name of its own', () => {
    expect(editionOptionsOf(file('main', 1920, 1080), null, [])[0]?.label).toBe('Original');
  });
});
