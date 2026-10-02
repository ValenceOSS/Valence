import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CalendarStateSign } from './CalendarStateSign';
import type { CalendarState } from '@ValenceContracts/schemas/ReleaseCalendar';

describe('CalendarStateSign', () => {
  it.each<[CalendarState, string]>([
    ['available', 'Available'],
    ['downloading', 'Downloading'],
    ['wanted', 'Wanted'],
    ['notOutYet', 'Not out yet'],
    ['notHeld', 'Not in the library'],
  ])('says %s in words for a screen reader', (state, said) => {
    render(<CalendarStateSign state={state} />);

    expect(screen.getByText(said)).toHaveClass('sr-only');
  });

  it('draws a different sign for each state', () => {
    const { container, rerender } = render(<CalendarStateSign state="available" />);
    const tick = container.innerHTML;

    rerender(<CalendarStateSign state="downloading" />);

    expect(container.innerHTML).not.toBe(tick);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarStateSign.displayName).toBe('CalendarStateSign');
  });
});
