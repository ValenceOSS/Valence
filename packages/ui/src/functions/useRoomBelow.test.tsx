import { render } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { useRoomBelow } from './useRoomBelow';

/**
 * A box sized by the room below it, saying what it was given.
 *
 * @param isOn - Whether to measure.
 * @returns The box.
 */
const Measured = ({ isOn }: { isOn: boolean }) => {
  const box = useRef<HTMLDivElement | null>(null);
  const room = useRoomBelow(box, isOn);

  return (
    <div ref={box} data-room={room === null ? 'none' : room.toString()}>
      box
    </div>
  );
};

describe('useRoomBelow', () => {
  it('gives a box the height of what scrolls it, less what sits around it', () => {
    const { container } = render(<Measured isOn />);

    expect(container.firstElementChild).toHaveAttribute('data-room', window.innerHeight.toString());
  });

  it('measures nothing when off', () => {
    const { container } = render(<Measured isOn={false} />);

    expect(container.firstElementChild).toHaveAttribute('data-room', 'none');
  });
});
