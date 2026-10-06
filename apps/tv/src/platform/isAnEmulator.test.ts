import { isAnEmulator } from '@ValenceTv/platform/isAnEmulator';

describe('isAnEmulator', () => {
  it('knows an Android emulator by its fingerprint or its model', () => {
    expect(
      isAnEmulator({
        Fingerprint: 'google/sdk_google_atv64_arm64/emu64a',
        Model: 'sdk_google_atv64_arm64',
      }),
    ).toBe(true);
    expect(isAnEmulator({ Fingerprint: 'generic/sdk_x86/generic_x86', Model: 'Android SDK' })).toBe(
      true,
    );
  });

  it('takes a television for what it is', () => {
    expect(isAnEmulator({ Fingerprint: 'google/sabrina/sabrina:12', Model: 'Chromecast' })).toBe(
      false,
    );
  });

  it('says no where the system says nothing of the kind', () => {
    expect(isAnEmulator({ interfaceIdiom: 'tv' })).toBe(false);
  });
});
