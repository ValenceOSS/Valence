import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TryItButton } from './TryItButton';

describe('TryItButton', () => {
  it('tries when pressed', async () => {
    const onTry = vi.fn();

    render(<TryItButton isTrying={false} verdict={null} onTry={onTry} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try it' }));

    expect(onTry).toHaveBeenCalled();
  });

  it('spins while trying, and cannot be pressed again', () => {
    render(<TryItButton isTrying verdict="working" onTry={vi.fn()} />);

    expect(screen.getByRole('status', { name: 'Working' })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button').querySelector('.text-success')).toBeNull();
  });

  it('shows a tick after a try that worked, and a cross after one that did not', () => {
    const { rerender } = render(<TryItButton isTrying={false} verdict="working" onTry={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Try it' }).querySelector('.text-success'),
    ).not.toBeNull();

    rerender(<TryItButton isTrying={false} verdict="failing" onTry={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Try it' }).querySelector('.text-danger'),
    ).not.toBeNull();
  });

  it('can be held back while something else is under way', () => {
    render(<TryItButton isTrying={false} verdict={null} isDisabled onTry={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Try it' })).toBeDisabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TryItButton.displayName).toBe('TryItButton');
  });
});
