import { AccessibilityInfo, Animated } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Marquee } from './Marquee';

const STYLE = { fontSize: 40 };

/**
 * The room the line slides in.
 */
const roomIn = (drawn: Awaited<ReturnType<typeof render>>) => {
  const [room] = drawn.container.queryAll(
    (node) => node.type === 'RCTScrollView' && node.props.horizontal === true,
  );

  if (room === undefined) {
    throw new Error('There is no room drawn.');
  }

  return room;
};

describe('Marquee', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('draws the line in a room the remote cannot scroll or stop on', async () => {
    const drawn = await render(<Marquee text="A very long song name" style={STYLE} />);

    expect(drawn.getByText('A very long song name')).toBeTruthy();
    expect(roomIn(drawn)).toHaveProp('scrollEnabled', false);
    expect(roomIn(drawn)).toHaveProp('focusable', false);
  });

  it('slides only where the line is wider than its room', async () => {
    const loop = jest.spyOn(Animated, 'loop');
    const drawn = await render(<Marquee text="Short" style={STYLE} />);

    await fireEvent(roomIn(drawn), 'layout', { nativeEvent: { layout: { width: 400 } } });
    await fireEvent(roomIn(drawn), 'contentSizeChange', 200, 48);

    expect(loop).not.toHaveBeenCalled();

    await fireEvent(roomIn(drawn), 'contentSizeChange', 900, 48);

    expect(loop).toHaveBeenCalled();
  });

  it('keeps still on one line, cut short, for somebody who asked for less motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    const drawn = await render(<Marquee text="A very long song name" style={STYLE} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(drawn.getByText('A very long song name')).toHaveProp('numberOfLines', 1);
    expect(drawn.container.queryAll((node) => node.type === 'RCTScrollView')).toHaveLength(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Marquee.displayName).toBe('Marquee');
  });
});
