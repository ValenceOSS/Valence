import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WindowControls } from './WindowControls';

const handlers = () => ({ onMinimise: vi.fn(), onMaximise: vi.fn(), onClose: vi.fn() });

describe('WindowControls', () => {
  it('minimises, maximises and closes the window', async () => {
    const user = userEvent.setup();
    const told = handlers();

    render(<WindowControls isMaximised={false} {...told} />);

    await user.click(screen.getByRole('button', { name: 'Minimise' }));
    await user.click(screen.getByRole('button', { name: 'Maximise' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect([
      told.onMinimise.mock.calls.length,
      told.onMaximise.mock.calls.length,
      told.onClose.mock.calls.length,
    ]).toEqual([1, 1, 1]);
  });

  it('offers to restore a window that fills the screen, rather than to maximise it again', () => {
    render(<WindowControls isMaximised {...handlers()} />);

    expect(screen.getByRole('button', { name: 'Restore down' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Maximise' })).not.toBeInTheDocument();
  });

  it('lights close red under the pointer, as the system’s own does', () => {
    render(<WindowControls isMaximised={false} {...handlers()} />);

    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('hover:bg-danger');
    expect(screen.getByRole('button', { name: 'Minimise' })).not.toHaveClass('hover:bg-danger');
  });

  it('draws the square smaller than the cross, since it fills more of its grid, and holds each size against the button’s own', () => {
    const { rerender } = render(<WindowControls isMaximised={false} {...handlers()} />);

    const widthOf = (name: string) =>
      screen.getByRole('button', { name }).querySelector('svg')?.getAttribute('width');

    const sizeClassOf = (name: string) =>
      [...(screen.getByRole('button', { name }).querySelector('svg')?.classList ?? [])].find(
        (style) => style.startsWith('size-'),
      );

    expect([widthOf('Minimise'), widthOf('Maximise'), widthOf('Close')]).toEqual([
      '0.8125rem',
      '0.6875rem',
      '1.0625rem',
    ]);

    rerender(<WindowControls isMaximised {...handlers()} />);

    expect(widthOf('Restore down')).toBe('0.625rem');
    expect(['Minimise', 'Restore down', 'Close'].map(sizeClassOf)).toEqual([
      'size-[0.8125rem]',
      'size-2.5',
      'size-[1.0625rem]',
    ]);
  });

  it('draws every glyph with one weight of line, though each is a different size', () => {
    render(<WindowControls isMaximised={false} {...handlers()} />);

    const drawnWeight = (name: string) => {
      const glyph = screen.getByRole('button', { name }).querySelector('svg');

      return (
        (Number(glyph?.getAttribute('stroke-width')) *
          Number.parseFloat(glyph?.getAttribute('width') ?? '')) /
        24
      ).toFixed(3);
    };

    expect(new Set(['Minimise', 'Maximise', 'Close'].map(drawnWeight)).size).toBe(1);
  });
});
