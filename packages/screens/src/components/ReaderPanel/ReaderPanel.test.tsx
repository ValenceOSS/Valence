import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReaderPanel } from './ReaderPanel';

/**
 * Draws the panel with the given overrides.
 */
const draw = (overrides: Partial<Parameters<typeof ReaderPanel>[0]> = {}) => {
  const handlers = { onPinnedChange: vi.fn(), onClose: vi.fn() };

  render(
    <ReaderPanel
      bookTitle="Rent-A-Girlfriend"
      placeTitle="Chapter 4"
      isPinned={false}
      pickers={<span>The pickers</span>}
      {...handlers}
      {...overrides}
    >
      <span>The settings</span>
    </ReaderPanel>,
  );

  return handlers;
};

describe('ReaderPanel', () => {
  it('says what is being read and where', () => {
    draw();

    expect(screen.getByText('Rent-A-Girlfriend')).toBeInTheDocument();
    expect(screen.getByText('Chapter 4')).toBeInTheDocument();
    expect(screen.getByText('The pickers')).toBeInTheDocument();
    expect(screen.getByText('The settings')).toBeInTheDocument();
  });

  it('leaves out where, for a book with only one place to be', () => {
    draw({ placeTitle: null });

    expect(screen.queryByText('Chapter 4')).not.toBeInTheDocument();
  });

  it('pins itself beside the page, and lets go again', async () => {
    const { onPinnedChange } = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Keep the panel beside the page' }));

    expect(onPinnedChange).toHaveBeenCalledWith(true);
  });

  it('offers to let go when pinned', () => {
    draw({ isPinned: true });

    expect(screen.getByRole('button', { name: 'Let the panel go' })).toBeInTheDocument();
  });

  it('puts itself away', async () => {
    const { onClose } = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Put the panel away' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReaderPanel.displayName).toBe('ReaderPanel');
  });
});
