import { act, renderHook } from '@testing-library/react-native';
import { useScanToOpen } from './useScanToOpen';

jest.mock('@ValenceTv/platform/theServersOrigin', () => ({
  onTheServer: (path: string) => `http://192.168.1.20:3000${path}`,
}));

describe('useScanToOpen', () => {
  it('shows a page of the server as a code, and settles once somebody is done', async () => {
    const { result } = await renderHook(() => useScanToOpen());
    let isSettled = false;

    await act(() => {
      void result.current.host
        .openOnServer('/api/plugins/anilist/accounts/anilist/connect?ticket=abc')
        .then(() => {
          isSettled = true;
        });
    });

    expect(result.current.address).toBe(
      'http://192.168.1.20:3000/api/plugins/anilist/accounts/anilist/connect?ticket=abc',
    );
    expect(isSettled).toBe(false);

    await act(() => {
      result.current.done();
    });

    expect(result.current.address).toBeNull();
    expect(isSettled).toBe(true);
  });

  it('shows nothing that is not a path on this server', async () => {
    const { result } = await renderHook(() => useScanToOpen());

    await act(async () => {
      await result.current.host.openOnServer('https://elsewhere.example/steal');
      await result.current.host.openOnServer('//elsewhere.example/steal');
    });

    expect(result.current.address).toBeNull();
  });
});
