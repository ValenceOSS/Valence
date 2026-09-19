import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StudiosRail } from './StudiosRail';

const STUDIOS = [
  { id: '2', name: 'Walt Disney Pictures', logoUrl: 'https://image/disney.png' },
  { id: '420', name: 'Marvel Studios', logoUrl: null },
];

describe('StudiosRail', () => {
  it('draws a studio as its mark, and one without a mark as its name', async () => {
    const onOpen = vi.fn();

    render(<StudiosRail studios={STUDIOS} onOpen={onOpen} />);

    expect(screen.getByRole('img', { name: 'Walt Disney Pictures' })).toBeInTheDocument();
    expect(screen.getByText('Marvel Studios')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Marvel Studios' }));

    expect(onOpen).toHaveBeenCalledWith('420');
  });
});
