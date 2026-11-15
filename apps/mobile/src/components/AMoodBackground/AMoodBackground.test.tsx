import { act, render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AMoodBackground } from './AMoodBackground';

jest.mock('@ValenceNative/motion/usePrefersStillness', () => ({
  usePrefersStillness: jest.fn(() => false),
}));

const RED = [{ colour: 'rgb(255 0 0)', at: '8.3% 12.5%', weight: 1 }];

const GREEN = [{ colour: 'rgb(0 255 0)', at: '8.3% 12.5%', weight: 1 }];

/**
 * Every background drawn beneath the lights, as one string to search.
 *
 * @returns What was drawn.
 */
const theBackgrounds = (): string => JSON.stringify(theDrawnRoot().children);

beforeEach(() => {
  jest.mocked(usePrefersStillness).mockReturnValue(false);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('AMoodBackground', () => {
  it('lights the page in the house colours where it has none of its own, out of the way of a press', async () => {
    await render(<AMoodBackground />);

    expect(theDrawnRoot().props.pointerEvents).toBe('none');
  });

  it('is drawn once and kept as one picture', async () => {
    await render(<AMoodBackground palette={[{ colour: '#ff0000', at: '10% 10%' }]} />);

    expect(theDrawnRoot().props.shouldRasterizeIOS).toBe(true);
  });

  it('is not kept as a picture while its colours crossfade', async () => {
    const drawn = await render(
      <AMoodBackground palette={[{ colour: '#ff0000', at: '10% 10%' }]} />,
    );

    await drawn.rerender(<AMoodBackground palette={[{ colour: '#00ff00', at: '10% 10%' }]} />);

    expect(theDrawnRoot().props.shouldRasterizeIOS).toBe(false);
  });

  it('blooms each light of a palette where it was read, weighted by how vivid it is', async () => {
    await render(
      <AMoodBackground
        palette={[...RED, { colour: 'rgb(128 128 128)', at: '25% 12.5%', weight: 0 }]}
      />,
    );

    expect(theBackgrounds()).toContain('at 8.3% 12.5%, rgba(255, 0, 0, 0.42) 0%');
    expect(theBackgrounds()).not.toContain('at 25% 12.5%');
  });

  it('crosses from one palette to the next, then keeps only the next', async () => {
    jest.useFakeTimers();
    const drawn = await render(<AMoodBackground palette={RED} />);

    await drawn.rerender(<AMoodBackground palette={GREEN} />);

    expect(theBackgrounds()).toContain('rgba(255, 0, 0');
    expect(theBackgrounds()).toContain('rgba(0, 255, 0');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1400);
    });

    expect(theBackgrounds()).not.toContain('rgba(255, 0, 0');
    expect(theDrawnRoot().props.shouldRasterizeIOS).toBe(true);
  });

  it('changes palette at once, without crossing, for somebody who wants less motion', async () => {
    jest.mocked(usePrefersStillness).mockReturnValue(true);
    jest.useFakeTimers();
    const timing = jest.spyOn(Animated, 'timing');
    const drawn = await render(<AMoodBackground palette={RED} />);

    await drawn.rerender(<AMoodBackground palette={GREEN} />);

    expect(theBackgrounds()).not.toContain('rgba(255, 0, 0');
    expect(theBackgrounds()).toContain('rgba(0, 255, 0');
    expect(timing).not.toHaveBeenCalled();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(theDrawnRoot().props.shouldRasterizeIOS).toBe(true);
    timing.mockRestore();
  });

  it('lights the first bloom in a colour it is given, and lets the house colours go', async () => {
    jest.mocked(usePrefersStillness).mockReturnValue(true);
    const drawn = await render(<AMoodBackground />);

    await drawn.rerender(<AMoodBackground lights={['#3366ff']} />);

    expect(theBackgrounds()).toContain('rgba(51, 102, 255, 0.36)');
  });

  it('does not build its fades again each time it is drawn', async () => {
    const multiply = jest.spyOn(Animated, 'multiply');
    const drawn = await render(<AMoodBackground />);
    const before = multiply.mock.calls.length;

    await drawn.rerender(<AMoodBackground />);
    await drawn.rerender(<AMoodBackground />);

    expect(multiply.mock.calls.length).toBe(before);
    multiply.mockRestore();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AMoodBackground.displayName).toBe('AMoodBackground');
  });
});
