import { renderHook, waitFor } from '@testing-library/react-native';
import { requireOptionalNativeModule } from 'expo';
import { usePaperOf } from './usePaperOf';

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn(() => null) }));

jest.mock('@ValenceMobile/platform/theCookiesThisPhoneHolds', () => ({
  theCookiesThisPhoneHolds: jest.fn(() => Promise.resolve('session=abc')),
}));

describe('usePaperOf', () => {
  it('knows no paper where no page is showing', async () => {
    const { result } = await renderHook(() => usePaperOf(null));

    expect(result.current).toBeNull();
  });

  it('knows no paper on a build that cannot read a picture, rather than failing', async () => {
    const { result } = await renderHook(() => usePaperOf('http://one.local/page/1'));

    expect(result.current).toBeNull();
  });

  it('reads the paper off the edge of the page, signed in as this phone is', async () => {
    const readEdge = jest.fn(() => Promise.resolve('#f4ecd8'));
    jest.mocked(requireOptionalNativeModule).mockReturnValue({ readEdge });

    const { result } = await renderHook(() => usePaperOf('http://one.local/page/2'));

    await waitFor(() => {
      expect(result.current).toBe('#f4ecd8');
    });
    expect(readEdge).toHaveBeenCalledWith('http://one.local/page/2', 'session=abc');
  });

  it('ignores an answer that is not a colour', async () => {
    jest
      .mocked(requireOptionalNativeModule)
      .mockReturnValue({ readEdge: () => Promise.resolve('paper') });

    const { result } = await renderHook(() => usePaperOf('http://one.local/page/3'));

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
});
