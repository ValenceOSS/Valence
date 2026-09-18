import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReaderChrome } from './ReaderChrome';

/**
 * Draws the chrome around a page, with the given overrides.
 */
const draw = (overrides: Partial<Parameters<typeof ReaderChrome>[0]> = {}) => {
  const handlers = { onForward: vi.fn(), onBack: vi.fn(), onClose: vi.fn() };

  render(
    <ReaderChrome
      title="Emma — Chapter I."
      isShown
      isRightToLeft={false}
      menus={<span>The menus</span>}
      footer={<span>The footer</span>}
      {...handlers}
      {...overrides}
    >
      <p>The page</p>
    </ReaderChrome>,
  );

  return handlers;
};

describe('ReaderChrome', () => {
  it('shows the title, the menus, the page and the footer', () => {
    draw();

    expect(screen.getByText('Emma — Chapter I.')).toBeInTheDocument();
    expect(screen.getByText('The menus')).toBeInTheDocument();
    expect(screen.getByText('The page')).toBeInTheDocument();
    expect(screen.getByText('The footer')).toBeInTheDocument();
  });

  it('leaves when closed', async () => {
    const { onClose } = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Close the reader' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('turns on from the right edge and back from the left in a book read left to right', async () => {
    const { onForward, onBack } = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));

    expect(onForward).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('swaps the edges for a book read right to left', async () => {
    const { onForward } = draw({ isRightToLeft: true });
    const [left] = screen.getAllByRole('button', { name: /page/ });

    expect(left).toHaveAccessibleName('Next page');

    if (left !== undefined) {
      await userEvent.click(left);
    }

    expect(onForward).toHaveBeenCalled();
  });

  it('cannot be pressed while hidden', () => {
    draw({ isShown: false });

    expect(screen.getByRole('banner', { hidden: true })).toHaveClass('pointer-events-none');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReaderChrome.displayName).toBe('ReaderChrome');
  });
});
