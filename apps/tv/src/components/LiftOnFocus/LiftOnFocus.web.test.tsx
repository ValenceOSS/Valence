import { act, render } from '@testing-library/react';
import { Text } from 'react-native';
import { LiftOnFocus } from '@ValenceTv/components/LiftOnFocus/LiftOnFocus';

describe('LiftOnFocus in a browser', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('lifts what it holds while the remote is inside, and lets it down after', () => {
    const drawn = render(
      <LiftOnFocus scale={1.1} shadowHeight={200} cornerRadius={12} isAnchoredLeft={false}>
        <Text>Poster</Text>
      </LiftOnFocus>,
    );
    const lift = drawn.getByText('Poster').parentElement;

    act(() => {
      drawn.getByText('Poster').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      jest.advanceTimersByTime(500);
    });

    expect(lift?.style.transform).toContain('scale(1.1)');

    act(() => {
      drawn.getByText('Poster').dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      jest.advanceTimersByTime(500);
    });

    expect(lift?.style.transform).toContain('scale(1)');
  });
});
