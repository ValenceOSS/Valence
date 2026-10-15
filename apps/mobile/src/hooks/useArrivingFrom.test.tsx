import { render, renderHook } from '@testing-library/react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useArrivingFrom } from './useArrivingFrom';

describe('useArrivingFrom', () => {
  it('is simply there, where it is not arriving from anywhere', async () => {
    const { result } = await renderHook(() => useArrivingFrom(() => null, false));

    expect(JSON.stringify(result.current.flying.opacity)).toBe('1');
  });

  it('waits unseen until it is placed, where it is arriving', async () => {
    const { result } = await renderHook(() =>
      useArrivingFrom(() => ({ x: 0, y: 0, width: 10, height: 10 }), true),
    );

    expect(JSON.stringify(result.current.flying.opacity)).toBe('0');
  });

  it('says once it is placed and showing, so whatever drew it before can go', async () => {
    const onShown = jest.fn();
    const held: { now: ReturnType<typeof useArrivingFrom> | null } = { now: null };

    /**
     * Holds a view where the hook can measure it.
     *
     * @returns The view.
     */
    const Probe = () => {
      const arriving = useArrivingFrom(
        () => ({ x: 0, y: 0, width: 10, height: 10 }),
        true,
        false,
        false,
        onShown,
      );

      const { placed } = arriving;

      useEffect(() => {
        held.now = arriving;
      });

      return <View ref={placed} />;
    };

    await render(<Probe />);

    const node = held.now?.placed.current;

    if (node === null || node === undefined) {
      throw new Error('The probe was not placed.');
    }

    jest.spyOn(node, 'measureInWindow').mockImplementation((told) => {
      told(20, 20, 10, 10);
    });
    held.now?.onPlaced();

    expect(onShown).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(held.now?.flying.opacity)).toBe('1');
  });
});
