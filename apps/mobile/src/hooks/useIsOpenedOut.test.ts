import { renderHook } from '@testing-library/react-native';
import { useIsOpenedOut } from '@ValenceMobile/hooks/useIsOpenedOut';
import { holdAWindowOf } from '@ValenceMobile/testing/holdAWindowOf';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useIsOpenedOut', () => {
  it('is not opened out on a phone held upright', async () => {
    holdAWindowOf(393, 852);

    const { result } = await renderHook(() => useIsOpenedOut());

    expect(result.current).toBe(false);
  });

  it('is not opened out on a phone turned sideways, however wide it is', async () => {
    holdAWindowOf(852, 393);

    const { result } = await renderHook(() => useIsOpenedOut());

    expect(result.current).toBe(false);
  });

  it('is opened out on the inside of a folding phone, either way up', async () => {
    holdAWindowOf(871, 669);

    const sideways = await renderHook(() => useIsOpenedOut());

    expect(sideways.result.current).toBe(true);

    holdAWindowOf(669, 871);

    const upright = await renderHook(() => useIsOpenedOut());

    expect(upright.result.current).toBe(true);
  });

  it('is opened out from the moment the shorter side reaches 600', async () => {
    holdAWindowOf(600, 800);

    const atTheLine = await renderHook(() => useIsOpenedOut());

    expect(atTheLine.result.current).toBe(true);

    holdAWindowOf(599, 800);

    const short = await renderHook(() => useIsOpenedOut());

    expect(short.result.current).toBe(false);
  });
});
