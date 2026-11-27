import { act, render } from '@testing-library/react-native';
import { Animated, Text } from 'react-native';
import type { HWEvent } from 'react-native';
import { GrowsWhenLeftAlone } from '@ValenceTv/components/MediaCard/components/GrowsWhenLeftAlone/GrowsWhenLeftAlone';

const mockRemote = new Set<(event: HWEvent) => void>();

let mockIsStill = false;

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

jest.mock('@ValenceTv/platform/useKeepsStill', () => ({
  useKeepsStill: () => mockIsStill,
}));

const sizes: number[] = [];

const sizeNow = (): number => sizes.at(-1) ?? 1;

const press = (): void => {
  for (const listener of mockRemote) {
    listener({ eventType: 'right', eventKeyAction: 0 });
  }
};

const passes = async (ms: number): Promise<void> => {
  await act(() => {
    jest.advanceTimersByTime(ms);
  });
};

const aCard = (isFocused: boolean) => (
  <GrowsWhenLeftAlone isFocused={isFocused}>
    <Text>Arrival</Text>
  </GrowsWhenLeftAlone>
);

describe('GrowsWhenLeftAlone', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockIsStill = false;
    sizes.length = 0;
    const timing = Animated.timing;

    jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
      if (typeof config.toValue === 'number') {
        sizes.push(config.toValue);
      }

      expect(config.useNativeDriver).toBe(true);

      return timing(value, config);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    mockRemote.clear();
  });

  it('grows the card the remote has rested on for five seconds', async () => {
    await render(aCard(true));

    await passes(4900);
    expect(sizeNow()).toBe(1);

    await passes(1000);
    expect(sizeNow()).toBeGreaterThan(1);
  });

  it('never grows a card the remote is not on, nor listens to the remote for it', async () => {
    await render(aCard(false));

    await passes(6000);

    expect(sizeNow()).toBe(1);
    expect(mockRemote.size).toBe(0);
  });

  it('brings it back the moment anything is pressed, and waits again before growing', async () => {
    await render(aCard(true));

    await passes(6000);
    await act(() => {
      press();
    });
    await passes(400);
    expect(sizeNow()).toBe(1);

    await passes(4000);
    expect(sizeNow()).toBe(1);

    await passes(2000);
    expect(sizeNow()).toBeGreaterThan(1);
  });

  it('brings it back as the remote moves on', async () => {
    const drawn = await render(aCard(true));

    await passes(6000);
    await drawn.rerender(aCard(false));
    await passes(400);

    expect(sizeNow()).toBe(1);
  });

  it('keeps it still on a television that keeps still', async () => {
    mockIsStill = true;

    await render(aCard(true));

    await passes(6000);

    expect(sizeNow()).toBe(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(GrowsWhenLeftAlone.displayName).toBe('GrowsWhenLeftAlone');
  });
});
