import { render } from '@testing-library/react';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';

/**
 * A screen with somewhere to go back to.
 *
 * @param back - What going back does.
 * @returns Nothing drawn.
 */
const Screen = ({ back }: { back: (() => void) | null }) => {
  useMenuButton(back);

  return null;
};

const pressBack = (key = 'Escape', keyCode = 27): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key, keyCode, cancelable: true });

  document.dispatchEvent(event);

  return event;
};

describe('useMenuButton in a browser', () => {
  it('hands Back to the screen that asked most recently, and to nothing once it is gone', () => {
    const outer = jest.fn();
    const inner = jest.fn();
    const drawn = render(
      <>
        <Screen back={outer} />
        <Screen back={inner} />
      </>,
    );

    expect(pressBack().defaultPrevented).toBe(true);
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();

    drawn.unmount();

    expect(pressBack().defaultPrevented).toBe(false);
  });

  it('hears LG’s Back button by its code', () => {
    const back = jest.fn();

    render(<Screen back={back} />);
    pressBack('Unidentified', 461);

    expect(back).toHaveBeenCalledTimes(1);
  });
});
