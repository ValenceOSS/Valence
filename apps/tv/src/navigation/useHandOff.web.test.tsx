import { act, render } from '@testing-library/react';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { nextFocusOverrides } from '@ValenceTv/focus/nextFocusOverrides';
import type { View } from 'react-native';

type HandOff = ReturnType<typeof useHandOff>;

/**
 * An edge and something it hands the remote to, and the hand-off between them.
 *
 * @param props - Which way the hand-off goes, whether there is anything to hand to, and who hears
 *   the hand-off.
 * @returns The two places.
 */
const Places = ({
  heading,
  hasTarget = true,
  told,
}: {
  heading: 'up' | 'down';
  hasTarget?: boolean;
  told: (handOff: HandOff) => void;
}) => {
  const [target, setTarget] = useState<View | null>(null);

  told(useHandOff(heading, target));

  return (
    <>
      <Pressable accessibilityLabel="Edge" onPress={jest.fn()}>
        <Text>Edge</Text>
      </Pressable>
      <Pressable
        {...(hasTarget ? { ref: setTarget } : {})}
        accessibilityLabel="Target"
        onPress={jest.fn()}
      >
        <Text>Target</Text>
      </Pressable>
    </>
  );
};

describe('useHandOff in a browser', () => {
  it('tells the focus engine where the press goes while the remote is on the edge, and forgets it after', () => {
    let handOff: HandOff | null = null;
    const drawn = render(<Places heading="up" told={(told) => (handOff = told)} />);
    const edge = drawn.getByLabelText('Edge');

    edge.focus();
    act(() => {
      handOff?.arrive();
    });

    expect(nextFocusOverrides.get(edge)?.up).toBe(drawn.getByLabelText('Target'));

    act(() => {
      handOff?.leave();
    });

    expect(nextFocusOverrides.get(edge)).toBeUndefined();
  });

  it('keeps what else the edge was told, such as where right goes', () => {
    let handOff: HandOff | null = null;
    const drawn = render(<Places heading="down" told={(told) => (handOff = told)} />);
    const edge = drawn.getByLabelText('Edge');
    const target = drawn.getByLabelText('Target');

    nextFocusOverrides.set(edge, { right: target });
    edge.focus();
    act(() => {
      handOff?.arrive();
      handOff?.leave();
    });

    expect(nextFocusOverrides.get(edge)).toEqual({ right: target });
  });

  it('leaves the focus engine to find its own way where there is nothing to hand to', () => {
    let handOff: HandOff | null = null;
    const drawn = render(
      <Places heading="up" hasTarget={false} told={(told) => (handOff = told)} />,
    );
    const edge = drawn.getByLabelText('Edge');

    edge.focus();
    act(() => {
      handOff?.arrive();
    });

    expect(nextFocusOverrides.get(edge)).toBeUndefined();
  });
});
