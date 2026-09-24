import { act, render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { TheFirstScreenWatch } from './TheFirstScreenWatch';

describe('TheFirstScreenWatch', () => {
  beforeEach(() => {
    installPlatform(aFakePlatform());
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('says the first screen is ready a moment in where there is no server to wait on', async () => {
    const onReady = jest.fn();

    await render(<TheFirstScreenWatch hasServer={false} isHomeReady={false} onReady={onReady} />, {
      wrapper: CacheScope,
    });

    expect(onReady).not.toHaveBeenCalled();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(800);
    });

    expect(onReady).toHaveBeenCalled();
  });

  it('stops waiting after a few seconds whatever happens', async () => {
    const onReady = jest.fn();

    await render(<TheFirstScreenWatch hasServer isHomeReady={false} onReady={onReady} />, {
      wrapper: CacheScope,
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(8100);
    });

    expect(onReady).toHaveBeenCalled();
  });
});
