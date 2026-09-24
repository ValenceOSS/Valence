import { act, renderHook } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readSoundPreference } from '@ValenceClient/playback/soundPreference';
import { useSoundPreference } from './useSoundPreference';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('useSoundPreference', () => {
  it('turns the sound off and on again, and keeps the choice on this phone', async () => {
    const { result } = await renderHook(() => useSoundPreference());
    const was = result.current.isMuted;

    await act(() => {
      result.current.toggle();
    });

    expect(result.current.isMuted).toBe(!was);
    expect(readSoundPreference()).toBe(was ? 'audible' : 'muted');
  });
});
