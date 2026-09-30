import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StudiosRail } from './StudiosRail';

const STUDIOS = [
  {
    id: '2',
    name: 'Walt Disney Pictures',
    logoUrl: 'https://image/disney.png',
    lightLogoUrl: 'https://image/disney-light.png',
  },
  { id: '420', name: 'Marvel Studios', logoUrl: null, lightLogoUrl: null },
];

describe('StudiosRail', () => {
  it('draws a studio as its mark, and one without a mark as its name', async () => {
    const onOpen = vi.fn();

    render(<StudiosRail studios={STUDIOS} onOpen={onOpen} />);

    expect(screen.getAllByRole('img', { name: 'Walt Disney Pictures' })).not.toHaveLength(0);
    expect(screen.getByText('Marvel Studios')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Marvel Studios' }));

    expect(onOpen).toHaveBeenCalledWith('420');
  });

  it('shows each mark once, in its own colours on a white plate, whatever the theme', () => {
    render(<StudiosRail studios={STUDIOS} onOpen={vi.fn()} />);

    const marks = screen.getAllByRole('img', { name: 'Walt Disney Pictures' });

    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveAttribute('src', 'https://image/disney.png');
    expect(screen.getByRole('button', { name: 'Walt Disney Pictures' })).toHaveClass('bg-plate');
  });
});
