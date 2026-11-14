import { afterEach, describe, expect, it, vi } from 'vitest';
import { thisDevicesLanguages } from './thisDevicesLanguages';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('thisDevicesLanguages', () => {
  it('lists the browser’s languages where it has them', () => {
    vi.stubGlobal('navigator', { languages: ['nl-BE', 'fr'] });

    expect(thisDevicesLanguages()).toEqual(['nl-BE', 'fr']);
  });

  it('falls back to the runtime’s own language', () => {
    vi.stubGlobal('navigator', {});

    expect(thisDevicesLanguages()).toEqual([Intl.DateTimeFormat().resolvedOptions().locale]);
  });
});
