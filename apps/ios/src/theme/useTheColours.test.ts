import { useColorScheme } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { theColours } from './theColours';
import { useTheColours } from './useTheColours';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

describe('useTheColours', () => {
  it('draws light where the phone is light', async () => {
    jest.mocked(useColorScheme).mockReturnValue('light');

    expect((await renderHook(() => useTheColours())).result.current).toBe(theColours.light);
  });

  it('draws dark where the phone is dark', async () => {
    jest.mocked(useColorScheme).mockReturnValue('dark');

    expect((await renderHook(() => useTheColours())).result.current).toBe(theColours.dark);
  });
});
