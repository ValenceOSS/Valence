import { act, render } from '@testing-library/react-native';
import { Animated, View } from 'react-native';
import { PageDot } from '@ValenceTv/components/PageDots/components/PageDot/PageDot';

type Drawn = Awaited<ReturnType<typeof render>>;

/**
 * The left round end of the dot drawn, whose place says where the dot begins.
 *
 * @param drawn - What was drawn.
 * @returns The left end.
 */
const leftEndOf = (drawn: Drawn) => drawn.getByTestId('row').children[1];

/**
 * The right round end of the dot drawn, whose place says where the dot ends.
 *
 * @param drawn - What was drawn.
 * @returns The right end.
 */
const rightEndOf = (drawn: Drawn) => drawn.getByTestId('row').children[2];

const runsInJavaScript = Animated.timing;

describe('PageDot', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest
      .spyOn(Animated, 'timing')
      .mockImplementation((value, config) =>
        runsInJavaScript(value, { ...config, useNativeDriver: false }),
      );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('is a small dot for a turn that is not now, and a longer pill for the turn now', async () => {
    const dot = await render(
      <View testID="row">
        <PageDot at={0} current={1} />
      </View>,
    );
    const pill = await render(
      <View testID="row">
        <PageDot at={1} current={1} />
      </View>,
    );

    expect(leftEndOf(dot)).toHaveStyle({ width: 12, height: 12, transform: [{ translateX: 0 }] });
    expect(rightEndOf(dot)).toHaveStyle({ transform: [{ translateX: 0 }] });
    expect(rightEndOf(pill)).toHaveStyle({ transform: [{ translateX: 64 }] });
  });

  it('eases into a pill as its turn comes', async () => {
    const drawn = await render(
      <View testID="row">
        <PageDot at={1} current={0} />
      </View>,
    );

    expect(leftEndOf(drawn)).toHaveStyle({ transform: [{ translateX: 64 }] });

    await drawn.rerender(
      <View testID="row">
        <PageDot at={1} current={1} />
      </View>,
    );

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(leftEndOf(drawn)).toHaveStyle({ transform: [{ translateX: 20 }] });
    expect(rightEndOf(drawn)).toHaveStyle({ transform: [{ translateX: 64 }] });
  });
});
