import { render } from '@testing-library/react-native';
import { Animated, StyleSheet } from 'react-native';
import { z } from 'zod';
import { WayInBackdrop } from '@ValenceTv/components/WayInBackdrop/WayInBackdrop';

const TintSchema = z.object({ tintColor: z.string() });

type Drawn = Awaited<ReturnType<typeof render>>;

const bloomTints = (drawn: Drawn): string[] =>
  (drawn.root?.queryAll((node) => node.type === 'Image') ?? []).flatMap((node) => {
    const tinted = TintSchema.safeParse(StyleSheet.flatten(node.props.style));

    return tinted.success ? [tinted.data.tintColor] : [];
  });

describe('WayInBackdrop', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lights the way in with twelve blooms of the house blues', async () => {
    const drawn = await render(<WayInBackdrop />);
    const tints = bloomTints(drawn);

    expect(tints).toHaveLength(12);
    expect(tints.every((tint) => tint.startsWith('rgb('))).toBe(true);
  });

  it('takes on the colour of whoever is signing in', async () => {
    const drawn = await render(<WayInBackdrop tint="#e8503a" />);

    expect(bloomTints(drawn)).toEqual(Array.from({ length: 12 }, () => '#e8503a'));
  });

  it('sets every bloom drifting, and stops them all once it is gone', async () => {
    const start = jest.fn();
    const stop = jest.fn();

    jest.spyOn(Animated, 'loop').mockReturnValue({ start, stop, reset: jest.fn() });

    const drawn = await render(<WayInBackdrop />);

    expect(start).toHaveBeenCalledTimes(12);
    expect(stop).not.toHaveBeenCalled();

    await drawn.unmount();

    expect(stop).toHaveBeenCalledTimes(12);
  });
});
