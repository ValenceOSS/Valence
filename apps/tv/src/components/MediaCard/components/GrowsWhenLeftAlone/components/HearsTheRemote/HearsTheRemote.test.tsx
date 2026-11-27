import { render } from '@testing-library/react-native';
import type { HWEvent } from 'react-native';
import { HearsTheRemote } from '@ValenceTv/components/MediaCard/components/GrowsWhenLeftAlone/components/HearsTheRemote/HearsTheRemote';

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

describe('HearsTheRemote', () => {
  it('passes on what the remote does while it is drawn, and stops once it is not', async () => {
    const onHeard = jest.fn();
    const drawn = await render(<HearsTheRemote onHeard={onHeard} />);

    for (const listener of mockRemote) {
      listener({ eventType: 'right', eventKeyAction: 0 });
    }

    expect(onHeard).toHaveBeenCalledTimes(1);

    await drawn.unmount();

    expect(mockRemote.size).toBe(0);
  });

  it('draws nothing', async () => {
    const drawn = await render(<HearsTheRemote onHeard={jest.fn()} />);

    expect(drawn.toJSON()).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HearsTheRemote.displayName).toBe('HearsTheRemote');
  });
});
