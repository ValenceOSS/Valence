import { Alert } from 'react-native';
import { renderHook, waitFor } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { dismissInPlace } from '@ValenceClient/library/dismissInPlace';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { useAskToDismiss } from './useAskToDismiss';

jest.mock('@ValenceClient/library/dismissInPlace', () => ({ dismissInPlace: jest.fn() }));
jest.mock('@ValenceClient/about/useServerHas', () => ({ useServerHas: jest.fn() }));

const dismissing = jest.mocked(dismissInPlace);

const serverHas = jest.mocked(useServerHas);

const EPISODE: MediaSummary = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Pilot',
  year: 2026,
  durationSeconds: 1500,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: 'a-show',
  seriesTitle: 'The Show',
};

beforeEach(() => {
  installPlatform(aFakePlatform());
  dismissing.mockReset();
  dismissing.mockResolvedValue(true);
  serverHas.mockReset();
  serverHas.mockReturnValue(true);
});

describe('useAskToDismiss', () => {
  it('offers nothing where the server cannot take things off the row', async () => {
    serverHas.mockReturnValue(false);

    const { result } = await renderHook(() => useAskToDismiss(), { wrapper: CacheScope });

    expect(result.current).toBeNull();
  });

  it('asks first by the programme’s name, and takes it off only once somebody says so', async () => {
    const asking = jest.spyOn(Alert, 'alert').mockClear();
    const { result } = await renderHook(() => useAskToDismiss(), { wrapper: CacheScope });

    result.current?.(EPISODE);

    expect(asking.mock.calls[0]?.[0]).toBe('Remove The Show from Continue watching?');
    expect(dismissing).not.toHaveBeenCalled();

    const buttons = asking.mock.calls[0]?.[2] ?? [];

    buttons.find((button) => button.text === 'Remove')?.onPress?.();

    expect(dismissing).toHaveBeenCalledWith(expect.anything(), EPISODE.id, true);
  });

  it('leaves it alone where somebody cancels', async () => {
    const asking = jest.spyOn(Alert, 'alert').mockClear();
    const { result } = await renderHook(() => useAskToDismiss(), { wrapper: CacheScope });

    result.current?.(EPISODE);

    const buttons = asking.mock.calls[0]?.[2] ?? [];

    buttons.find((button) => button.style === 'cancel')?.onPress?.();

    expect(dismissing).not.toHaveBeenCalled();
  });

  it('says so where the server would not take it off', async () => {
    dismissing.mockResolvedValue(false);

    const asking = jest.spyOn(Alert, 'alert').mockClear();
    const { result } = await renderHook(() => useAskToDismiss(), { wrapper: CacheScope });

    result.current?.(EPISODE);
    (asking.mock.calls[0]?.[2] ?? []).find((button) => button.text === 'Remove')?.onPress?.();

    await waitFor(() => {
      expect(asking).toHaveBeenLastCalledWith(
        'Couldn’t remove The Show from Continue watching. Try again.',
      );
    });
  });
});
