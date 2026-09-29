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

  it('has a mark coloured for each theme, so the one shown sits in the colours of the text', () => {
    render(<StudiosRail studios={STUDIOS} onOpen={vi.fn()} />);

    const [onDark, onLight] = screen.getAllByRole('img', { name: 'Walt Disney Pictures' });

    expect(onDark).toHaveAttribute('src', 'https://image/disney.png');
    expect(onDark).toHaveClass('valence-mark-on-dark');
    expect(onLight).toHaveAttribute('src', 'https://image/disney-light.png');
    expect(onLight).toHaveClass('valence-mark-on-light');
  });
});
