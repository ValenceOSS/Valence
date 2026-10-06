import { Platform } from 'react-native';
import type { HWEvent } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useRemote } from '@ValenceTv/remote/useRemote';

const mockRemote = new Set<(event: HWEvent) => void>();

jest.mock('react-native/Libraries/Components/TV/TVEventHandler', () => ({
  __esModule: true,
  default: {
    addListener: (heard: (event: HWEvent) => void) => {
      mockRemote.add(heard);

      return {
        remove: () => {
          mockRemote.delete(heard);
        },
      };
    },
  },
}));

const press = (event: HWEvent): void => {
  for (const listener of mockRemote) {
    listener(event);
  }
};

describe('useRemote', () => {
  const was = Platform.OS;

  afterEach(() => {
    Platform.OS = was;
    mockRemote.clear();
  });

  it('passes on what the Siri Remote says as it is', async () => {
    const hear = jest.fn();

    await renderHook(() => {
      useRemote(hear);
    });
    press({ eventType: 'play', eventKeyAction: 1 });

    expect(hear).toHaveBeenCalledWith({ eventType: 'play', eventKeyAction: 1 });
  });

  it('reads an Android remote the way the Siri Remote would have said it', async () => {
    Platform.OS = 'android';

    const hear = jest.fn();

    await renderHook(() => {
      useRemote(hear);
    });
    press({ eventType: 'play', eventKeyAction: 1 });

    expect(hear).toHaveBeenCalledWith({ eventType: 'playPause', eventKeyAction: 1 });
  });
});
