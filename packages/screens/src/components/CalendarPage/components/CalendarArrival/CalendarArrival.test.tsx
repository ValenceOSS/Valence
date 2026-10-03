import { render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { describe, expect, it } from 'vitest';
import { CalendarArrival } from './CalendarArrival';

describe('CalendarArrival', () => {
  it('holds the entry as an item of the list it is in', () => {
    render(
      <ul>
        <CalendarArrival delay={0.1}>
          <span>A Show</span>
        </CalendarArrival>
      </ul>,
    );

    expect(screen.getByRole('listitem')).toHaveTextContent('A Show');
  });

  it('takes the caller layout classes', () => {
    render(
      <ul>
        <CalendarArrival className="col-span-2">
          <span>A Show</span>
        </CalendarArrival>
      </ul>,
    );

    expect(screen.getByRole('listitem')).toHaveClass('col-span-2');
  });

  it('still shows the entry for somebody who asked for less motion', () => {
    render(
      <MotionConfig reducedMotion="always">
        <ul>
          <CalendarArrival delay={0.4}>
            <span>A Show</span>
          </CalendarArrival>
        </ul>
      </MotionConfig>,
    );

    expect(screen.getByRole('listitem')).toHaveTextContent('A Show');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarArrival.displayName).toBe('CalendarArrival');
  });
});
