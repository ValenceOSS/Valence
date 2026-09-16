import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoadRangeToggle } from './LoadRangeToggle';

describe('LoadRangeToggle', () => {
  it('offers the last minute alongside every persisted range', () => {
    render(<LoadRangeToggle value="minute" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Last minute' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '24h' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3d' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument();
  });

  it('marks the chosen range as pressed', () => {
    render(<LoadRangeToggle value="3d" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '3d' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '24h' })).not.toHaveAttribute('aria-pressed');
  });

  it('tells its caller which range was chosen', async () => {
    const actor = userEvent.setup();
    const onChange = vi.fn();

    render(<LoadRangeToggle value="minute" onChange={onChange} />);

    await actor.click(screen.getByRole('button', { name: '7d' }));

    expect(onChange).toHaveBeenCalledWith('7d');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LoadRangeToggle.displayName).toBe('LoadRangeToggle');
  });
});
