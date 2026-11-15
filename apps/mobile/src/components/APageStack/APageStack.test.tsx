import { useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import { APageStack } from './APageStack';

type ATouch = { absoluteX: number; absoluteY: number };

type AGestureEvent = {
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
  canceled: boolean;
};

type ARecordedGesture = {
  testID: string;
  onTouchesDown: (event: { handlerTag: number; changedTouches: ATouch[] }) => void;
  onTouchesMove: (event: { handlerTag: number; allTouches: ATouch[] }) => void;
  onActivate: (event: AGestureEvent) => void;
  onUpdate: (event: AGestureEvent) => void;
  onDeactivate: (event: AGestureEvent) => void;
};

const mockGestures = new Map<string, ARecordedGesture>();

const mockActivate = jest.fn();

const mockFail = jest.fn();

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ gesture, children }: { gesture: ARecordedGesture; children?: ReactNode }) => {
    mockGestures.set(gesture.testID, gesture);

    return children;
  },
  GestureStateManager: {
    activate: (handlerTag: number) => {
      mockActivate(handlerTag);
    },
    fail: (handlerTag: number) => {
      mockFail(handlerTag);
    },
  },
  usePanGesture: (config: ARecordedGesture) => config,
}));

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual<object>('react-native-safe-area-context'),
  useSafeAreaInsets: jest.fn(),
}));

const rendered = jest.fn();

const mounted = jest.fn();

const Named = ({ name }: { name: string }) => {
  const isOnTop = useContext(IS_ON_TOP);

  rendered(name);

  useEffect(() => {
    mounted(name);
  }, [name]);

  return <Text>{`${name}${isOnTop ? ' on top' : ' covered'}`}</Text>;
};

const aPage = (name: string) => ({ key: name, page: <Named name={name} /> });

const aCard = (name: string) => ({ ...aPage(name), isCard: true });

const STILL: AGestureEvent = {
  translationX: 0,
  translationY: 0,
  velocityX: 0,
  velocityY: 0,
  canceled: false,
};

/**
 * The page in the stack that holds some words, as the stack placed it.
 *
 * @param words - Words drawn on the page.
 * @returns Where the page was placed.
 */
const thePageHolding = (words: string) => {
  let at = screen.getByText(words).parent;

  while (at !== null && at.props.renderToHardwareTextureAndroid === undefined) {
    at = at.parent;
  }

  if (at === null) {
    throw new Error('Those words are not on a page in the stack.');
  }

  return at;
};

/**
 * One of the stack's gestures, as the stack last set it up.
 *
 * @param name - Which.
 * @returns The gesture.
 */
const theGesture = (name: string): ARecordedGesture => {
  const gesture = mockGestures.get(name);

  if (gesture === undefined) {
    throw new Error('The stack set up no such gesture.');
  }

  return gesture;
};

/**
 * Drags a finger from one point to another, as far as deciding whose gesture it is.
 *
 * @param gesture - The gesture asked.
 * @param from - Where the finger went down.
 * @param to - Where it moved to.
 */
const touch = (gesture: ARecordedGesture, from: ATouch, to: ATouch) => {
  gesture.onTouchesDown({ handlerTag: 1, changedTouches: [from] });
  gesture.onTouchesMove({ handlerTag: 1, allTouches: [to] });
};

/**
 * Lets the frozen pages settle, which waits a moment once they are covered.
 */
const letThemFreeze = async () => {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  });
};

/**
 * How each screen of the stack is kept, bottom first.
 *
 * @returns Each screen's activity.
 */
const theActivities = () =>
  screen.container
    .queryAll((one) => one.type === 'RNSScreen')
    .map((one) => z.number().parse(one.props.activityState));

const MovedSchema = z.object({
  value: z.object({ transform: z.array(z.record(z.string(), z.number())) }),
});

/**
 * Where the page holding some words has been moved to, once its animation has run.
 *
 * @param words - Words drawn on the page.
 * @returns How it is moved.
 */
const whereItWasMoved = (words: string) =>
  MovedSchema.parse(thePageHolding(words).props.jestAnimatedStyle).value.transform;

beforeEach(() => {
  mockGestures.clear();
  rendered.mockClear();
  mounted.mockClear();
  mockActivate.mockClear();
  mockFail.mockClear();
  jest
    .mocked(useSafeAreaInsets)
    .mockReset()
    .mockReturnValue({ top: 59, bottom: 34, left: 0, right: 0 });
});

describe('APageStack', () => {
  it('shows only the page on top to anybody reading the screen', async () => {
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    expect(drawn.getByText('Arrival on top')).toBeTruthy();
    expect(drawn.queryByText('Home covered')).toBeNull();
  });

  it('keeps the pages beneath drawn, and tells them they are covered', async () => {
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    expect(drawn.getByText('Home covered', { includeHiddenElements: true })).toBeTruthy();
  });

  it('tells the page beneath it is on top again once the one over it goes', async () => {
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    await act(async () => {
      await drawn.rerender(<APageStack pages={[aPage('Home')]} onBack={jest.fn()} />);
    });

    expect(drawn.getByText('Home on top')).toBeTruthy();
  });

  it('slides what is left back into place once the page over it goes, then lets that one go', async () => {
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    await act(async () => {
      await drawn.rerender(<APageStack pages={[aPage('Home')]} onBack={jest.fn()} />);
    });

    await waitFor(
      () => {
        expect(drawn.queryByText('Arrival covered', { includeHiddenElements: true })).toBeNull();
      },
      { timeout: 3000 },
    );

    expect(whereItWasMoved('Home on top')).toEqual([{ translateX: 0 }]);
  });

  it('slides a page swapped in on top into place, even while the one it replaced was arriving', async () => {
    const drawn = await render(<APageStack pages={[aPage('Home')]} onBack={jest.fn()} />);

    await act(async () => {
      await drawn.rerender(
        <APageStack pages={[aPage('Home'), aPage('Asking')]} onBack={jest.fn()} />,
      );
    });

    await act(async () => {
      await drawn.rerender(
        <APageStack pages={[aPage('Home'), aPage('Title')]} onBack={jest.fn()} />,
      );
    });

    expect(drawn.getByText('Title on top')).toBeTruthy();
    expect(drawn.queryByText('Asking on top', { includeHiddenElements: true })).toBeNull();

    await waitFor(
      () => {
        expect(whereItWasMoved('Title on top')).toEqual([{ translateX: 0 }]);
      },
      { timeout: 3000 },
    );
  });

  it('stops a card just short of the status bar', async () => {
    await render(<APageStack pages={[aPage('Home'), aCard('Arrival')]} onBack={jest.fn()} />);

    expect(thePageHolding('Arrival on top')).toHaveStyle({ top: 69 });
  });

  it('keeps a card below the clock where the screen keeps no room at its top for it', async () => {
    jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 0, bottom: 20, left: 0, right: 84 });

    await render(<APageStack pages={[aPage('Home'), aCard('Arrival')]} onBack={jest.fn()} />);

    expect(thePageHolding('Arrival on top')).toHaveStyle({ top: 46 });
  });

  it('keeps the top two pages on the screen and takes the rest off it', async () => {
    await render(
      <APageStack
        pages={[aPage('Home'), aPage('Shelf'), aPage('Middle'), aPage('Arrival')]}
        onBack={jest.fn()}
      />,
    );

    expect(theActivities()).toEqual([0, 0, 1, 2]);
  });

  it('keeps the page a card shrinks on the screen, and the one around it too', async () => {
    await render(
      <APageStack
        pages={[aPage('Home'), aPage('Shelf'), aPage('Middle'), aCard('Arrival')]}
        onBack={jest.fn()}
      />,
    );

    expect(theActivities().slice(0, 4)).toEqual([0, 1, 1, 2]);
  });

  it('stops drawing a covered page again while it is frozen beneath the others', async () => {
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Middle'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    await letThemFreeze();
    rendered.mockClear();

    await act(async () => {
      await drawn.rerender(
        <APageStack
          pages={[aPage('Home'), aPage('Middle'), aPage('Arrival')]}
          onBack={jest.fn()}
        />,
      );
    });

    expect(rendered).not.toHaveBeenCalledWith('Home');
    expect(rendered).toHaveBeenCalledWith('Middle');
  });

  it('keeps a frozen page as it was left, and wakes it when it is gone back to', async () => {
    const pages = [aPage('Home'), aPage('Middle'), aPage('Arrival')];
    const drawn = await render(<APageStack pages={pages} onBack={jest.fn()} />);

    await letThemFreeze();

    await act(async () => {
      await drawn.rerender(<APageStack pages={pages.slice(0, 2)} onBack={jest.fn()} />);
    });

    await act(async () => {
      await drawn.rerender(<APageStack pages={pages.slice(0, 1)} onBack={jest.fn()} />);
    });

    expect(drawn.getByText('Home on top')).toBeTruthy();
    expect(mounted.mock.calls.filter(([name]) => name === 'Home')).toHaveLength(1);
  });

  it('goes back when the page on top is swiped far enough from the left edge', async () => {
    const onBack = jest.fn();

    await render(<APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={onBack} />);

    const swipe = theGesture('swipeBack');

    touch(swipe, { absoluteX: 10, absoluteY: 300 }, { absoluteX: 30, absoluteY: 302 });

    expect(mockActivate).toHaveBeenCalledWith(1);

    swipe.onActivate(STILL);
    swipe.onUpdate({ ...STILL, translationX: 500 });
    swipe.onDeactivate({ ...STILL, translationX: 500 });

    await waitFor(
      () => {
        expect(onBack).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
  });

  it('springs the page home when it is let go of before it has gone far enough', async () => {
    const onBack = jest.fn();

    await render(<APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={onBack} />);

    const swipe = theGesture('swipeBack');

    touch(swipe, { absoluteX: 10, absoluteY: 300 }, { absoluteX: 30, absoluteY: 302 });
    swipe.onActivate(STILL);
    swipe.onUpdate({ ...STILL, translationX: 40 });
    swipe.onDeactivate({ ...STILL, translationX: 40 });

    await waitFor(
      () => {
        expect(whereItWasMoved('Arrival on top')).toEqual([{ translateX: 0 }]);
      },
      { timeout: 3000 },
    );

    expect(onBack).not.toHaveBeenCalled();
  });

  it('leaves a swipe that starts away from the left edge to the page', async () => {
    await render(<APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />);

    touch(
      theGesture('swipeBack'),
      { absoluteX: 120, absoluteY: 300 },
      { absoluteX: 200, absoluteY: 302 },
    );

    expect(mockFail).toHaveBeenCalledWith(1);
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('leaves a page that holds its edge to be left by its own way back', async () => {
    await render(
      <APageStack
        pages={[aPage('Home'), { ...aPage('Reading'), holdsTheEdge: true }]}
        onBack={jest.fn()}
      />,
    );

    touch(
      theGesture('swipeBack'),
      { absoluteX: 10, absoluteY: 300 },
      { absoluteX: 40, absoluteY: 302 },
    );

    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('closes a card dragged down far enough', async () => {
    const onBack = jest.fn();

    await render(<APageStack pages={[aPage('Home'), aCard('Arrival')]} onBack={onBack} />);

    const drag = theGesture('dragDown');

    touch(drag, { absoluteX: 200, absoluteY: 300 }, { absoluteX: 202, absoluteY: 320 });

    expect(mockActivate).toHaveBeenCalledWith(1);

    drag.onActivate({ ...STILL, translationY: 20 });
    drag.onUpdate({ ...STILL, translationY: 1000 });
    drag.onDeactivate({ ...STILL, translationY: 1000 });

    await waitFor(
      () => {
        expect(onBack).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
  });

  it('leaves a sideways drag on a card to the card', async () => {
    await render(<APageStack pages={[aPage('Home'), aCard('Arrival')]} onBack={jest.fn()} />);

    touch(
      theGesture('dragDown'),
      { absoluteX: 200, absoluteY: 300 },
      { absoluteX: 230, absoluteY: 320 },
    );

    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('does not drag down a page that neither rises nor is a card', async () => {
    await render(<APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />);

    touch(
      theGesture('dragDown'),
      { absoluteX: 200, absoluteY: 300 },
      { absoluteX: 200, absoluteY: 340 },
    );

    expect(mockActivate).not.toHaveBeenCalled();
  });
});
