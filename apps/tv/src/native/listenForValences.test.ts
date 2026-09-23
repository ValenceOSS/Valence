import { act } from '@testing-library/react-native';
import { listenForValences } from '@ValenceTv/native/listenForValences';
import type * as ListenForValences from '@ValenceTv/native/listenForValences';

type Said = Record<string, string | number>;

const mockListeners = new Map<string, (said: Said) => void>();

const mockDiscovery = { start: jest.fn(), stop: jest.fn(), removed: jest.fn() };

const mockReach = jest.fn<Promise<boolean>, [string]>(() => Promise.resolve(true));

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: () => ({
    start: () => {
      mockDiscovery.start();
    },
    stop: () => {
      mockDiscovery.stop();
    },
    addListener: (event: string, listener: (said: Said) => void) => {
      mockListeners.set(event, listener);

      return {
        remove: () => {
          mockDiscovery.removed(event);
        },
      };
    },
  }),
}));

jest.mock('@ValenceTv/native/isAValence', () => ({
  isAValence: (address: string) => mockReach(address),
}));

const say = (event: string, said: Said): void => {
  mockListeners.get(event)?.(said);
};

beforeEach(() => {
  mockListeners.clear();
  mockDiscovery.start.mockClear();
  mockDiscovery.stop.mockClear();
  mockDiscovery.removed.mockClear();
  mockReach.mockClear();
});

describe('listenForValences', () => {
  it('starts listening, and tells each server heard that answers', async () => {
    const onChange = jest.fn();

    listenForValences(onChange);

    expect(mockDiscovery.start).toHaveBeenCalledTimes(1);

    await act(async () => {
      say('onFound', { name: 'Home', host: '192.168.1.5', port: 3000 });
      await Promise.resolve();
    });

    expect(mockReach).toHaveBeenCalledWith('http://192.168.1.5:3000');
    expect(onChange).toHaveBeenLastCalledWith([
      { name: 'Home', address: 'http://192.168.1.5:3000' },
    ]);
  });

  it('forgets a server that says goodbye', async () => {
    const onChange = jest.fn();

    listenForValences(onChange);

    await act(async () => {
      say('onFound', { name: 'Home', host: '192.168.1.5', port: 3000 });
      await Promise.resolve();
    });

    say('onLost', { name: 'Home' });

    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('ignores what the system says that makes no sense', async () => {
    const onChange = jest.fn();

    listenForValences(onChange);

    await act(async () => {
      say('onFound', { name: 'Home', host: '', port: 3000 });
      say('onFound', { name: 'Home', host: 'tv.local', port: -1 });
      say('onLost', { name: '' });
      await Promise.resolve();
    });

    expect(mockReach).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('stops listening when asked', () => {
    listenForValences(jest.fn())();

    expect(mockDiscovery.removed).toHaveBeenCalledWith('onFound');
    expect(mockDiscovery.removed).toHaveBeenCalledWith('onLost');
    expect(mockDiscovery.stop).toHaveBeenCalledTimes(1);
  });

  it('hears nothing in a build without the native module', () => {
    jest.resetModules();
    jest.doMock('expo', () => ({
      ...jest.requireActual<object>('expo'),
      requireOptionalNativeModule: () => null,
    }));

    const { listenForValences: withoutTheModule } = jest.requireActual<typeof ListenForValences>(
      '@ValenceTv/native/listenForValences',
    );
    const onChange = jest.fn();

    expect(() => {
      withoutTheModule(onChange)();
    }).not.toThrow();
    expect(mockDiscovery.start).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
