import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoadRangeToggle } from './LoadRangeToggle';

const MENU = 'Load time range';

describe('LoadRangeToggle', () => {
  it('shows the range chosen on its trigger', () => {
    render(<LoadRangeToggle value="3d" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: MENU })).toHaveTextContent('Last 3 days');
  });

  it('offers the last minute alongside every persisted range, the chosen one checked', async () => {
    const user = userEvent.setup();

    render(<LoadRangeToggle value="3d" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: MENU }));

    expect(await screen.findByRole('menuitemradio', { name: 'Last minute' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Last 24 hours' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Last 7 days' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Last 3 days' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('tells its caller which range was chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<LoadRangeToggle value="minute" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: MENU }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Last 7 days' }));

    expect(onChange).toHaveBeenCalledWith('7d');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LoadRangeToggle.displayName).toBe('LoadRangeToggle');
  });
});
