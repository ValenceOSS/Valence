import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HistoryArrows } from './HistoryArrows';

const draw = (overrides: Partial<Parameters<typeof HistoryArrows>[0]> = {}) => {
  const props = {
    canGoBack: true,
    canGoForward: false,
    onBack: vi.fn(),
    onForward: vi.fn(),
    backLabel: 'Go back',
    forwardLabel: 'Go forward',
    ...overrides,
  };

  render(<HistoryArrows {...props} />);

  return props;
};

describe('HistoryArrows', () => {
  it('goes back when its back half is pressed', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(props.onBack).toHaveBeenCalledOnce();
  });

  it('keeps an arrow with nowhere to go, dimmed and unpressable', () => {
    draw();

    const forward = screen.getByRole('button', { name: 'Go forward' });

    expect(forward).toBeDisabled();
    expect(forward).toHaveClass('disabled:opacity-50');
  });

  it('draws the two as halves of one shape', () => {
    draw();

    expect(screen.getByRole('button', { name: 'Go back' })).toHaveClass('rounded-r-none');
    expect(screen.getByRole('button', { name: 'Go forward' })).toHaveClass('rounded-l-none');
  });

  it('names the keys that do the same once the pointer rests on one', async () => {
    const user = userEvent.setup();

    draw({ canGoForward: true, forwardKeys: ['⌘', ']'] });

    await user.hover(screen.getByRole('button', { name: 'Go forward' }));

    expect(await screen.findByText(']')).toBeInTheDocument();
    expect(screen.getByText('⌘')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HistoryArrows.displayName).toBe('HistoryArrows');
  });
});
