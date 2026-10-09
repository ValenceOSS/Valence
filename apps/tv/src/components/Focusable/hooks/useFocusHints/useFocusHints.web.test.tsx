import { render } from '@testing-library/react';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useFocusHints } from '@ValenceTv/components/Focusable/hooks/useFocusHints/useFocusHints';
import { nextFocusOverrides } from '@ValenceTv/focus/nextFocusOverrides';
import type { View } from 'react-native';

/**
 * Two pressable places, the first wanting the remote and sending right, down and up to the second.
 *
 * @returns The places.
 */
const TwoPlaces = () => {
  const [second, setSecond] = useState<View | null>(null);
  const { ref, hints } = useFocusHints(undefined, true, {
    right: second,
    down: second,
    up: second,
  });

  return (
    <>
      <Pressable ref={ref} accessibilityLabel="First" onPress={jest.fn()} {...hints}>
        <Text>First</Text>
      </Pressable>
      <Pressable ref={setSecond} accessibilityLabel="Second" onPress={jest.fn()}>
        <Text>Second</Text>
      </Pressable>
    </>
  );
};

describe('useFocusHints in a browser', () => {
  it('takes the remote once drawn, and tells the focus engine where right, down and up go', () => {
    const drawn = render(<TwoPlaces />);
    const first = drawn.getByLabelText('First');

    expect(document.activeElement).toBe(first);
    expect(nextFocusOverrides.get(first)?.right).toBe(drawn.getByLabelText('Second'));
    expect(nextFocusOverrides.get(first)?.down).toBe(drawn.getByLabelText('Second'));
    expect(nextFocusOverrides.get(first)?.up).toBe(drawn.getByLabelText('Second'));
  });
});
