import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CalendarQuietDay } from './CalendarQuietDay';

describe('CalendarQuietDay', () => {
  it('says nothing is released on the day', () => {
    render(<CalendarQuietDay />);

    expect(screen.getByText('No releases')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarQuietDay.displayName).toBe('CalendarQuietDay');
  });
});
