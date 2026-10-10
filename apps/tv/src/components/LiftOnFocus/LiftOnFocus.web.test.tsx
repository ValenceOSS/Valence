import { act, render } from '@testing-library/react';
import { Text } from 'react-native';
import { LiftOnFocus } from '@ValenceTv/components/LiftOnFocus/LiftOnFocus';

/**
 * Moves the remote onto, or off, what is drawn.
 *
 * @param target - Where the remote lands or leaves.
 * @param kind - Whether it lands or leaves.
 */
const move = (target: HTMLElement, kind: 'focusin' | 'focusout') => {
  act(() => {
    target.dispatchEvent(new FocusEvent(kind, { bubbles: true }));
  });
};

describe('LiftOnFocus in a browser', () => {
  it('rings a card in white while the remote is on it, and takes the ring away after', () => {
    const drawn = render(
      <LiftOnFocus scale={1.1} shadowHeight={200} cornerRadius={12} isAnchoredLeft={false}>
        <Text>Poster</Text>
      </LiftOnFocus>,
    );
    const poster = drawn.getByText('Poster');
    const ring = poster.parentElement?.lastElementChild;

    expect(getComputedStyle(ring ?? document.body).opacity).toBe('0');

    move(poster, 'focusin');

    expect(getComputedStyle(ring ?? document.body).opacity).toBe('1');
    expect(getComputedStyle(ring ?? document.body).borderTopColor).toBe('rgba(255,255,255,1.00)');
    expect(poster.parentElement?.style.transform ?? '').not.toContain('scale');

    move(poster, 'focusout');

    expect(getComputedStyle(ring ?? document.body).opacity).toBe('0');
  });

  it('grows what is not a card instead, and lets it down after', () => {
    const drawn = render(
      <LiftOnFocus scale={1.05} shadowHeight={0} cornerRadius={0} isAnchoredLeft={false}>
        <Text>Watch</Text>
      </LiftOnFocus>,
    );
    const button = drawn.getByText('Watch');

    move(button, 'focusin');

    expect(button.parentElement?.style.transform).toBe('scale(1.05)');

    move(button, 'focusout');

    expect(button.parentElement?.style.transform).toBe('');
  });
});
