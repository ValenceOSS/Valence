import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BusyHoursGrid } from './BusyHoursGrid';

const startedAt = (day: number, hour: number, count: number) =>
  Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) => (d === day && h === hour ? count : 0)),
  );

describe('BusyHoursGrid', () => {
  it('names the busiest hour to anybody who cannot see the grid', () => {
    render(<BusyHoursGrid hours={startedAt(4, 21, 5)} label="Busy hours" />);

    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Friday');
  });

  it('says when nothing was started', () => {
    render(<BusyHoursGrid hours={startedAt(0, 0, 0)} label="Busy hours" />);

    expect(screen.getByText('Nothing was started in this range.')).toBeInTheDocument();
  });

  it('says what was started in the hour pointed at', () => {
    const { container } = render(<BusyHoursGrid hours={startedAt(0, 9, 2)} label="Busy hours" />);
    const cell = container.querySelectorAll('.grid-cols-24 > span').item(9);

    fireEvent.pointerEnter(cell);

    expect(screen.getByText(/2 plays/)).toBeInTheDocument();
  });
});
