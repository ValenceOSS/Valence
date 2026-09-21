import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReaderChrome } from './ReaderChrome';

/**
 * Draws the chrome around a page, with the given overrides.
 */
const draw = (overrides: Partial<Parameters<typeof ReaderChrome>[0]> = {}) => {
  const handlers = {
    onForward: vi.fn(),
    onBack: vi.fn(),
    onClose: vi.fn(),
    onPanelOpenChange: vi.fn(),
  };

  render(
    <ReaderChrome
      title="Emma — Chapter I."
      isShown
      isRightToLeft={false}
      panel={<span>The panel</span>}
      isPanelOpen={false}
      isPanelPinned={false}
      footer={<span>The footer</span>}
      {...handlers}
      {...overrides}
    >
      <p>The page</p>
    </ReaderChrome>,
  );

  return handlers;
};

afterEach(() => {
  Reflect.deleteProperty(document, 'fullscreenEnabled');
});

describe('ReaderChrome', () => {
  it('shows the title, the page and the footer, and keeps the panel away until asked', () => {
    draw();

    expect(screen.getByText('Emma — Chapter I.')).toBeInTheDocument();
    expect(screen.queryByText('The panel')).not.toBeInTheDocument();
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

  it('brings out the panel when asked', async () => {
    const { onPanelOpenChange } = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));

    expect(onPanelOpenChange).toHaveBeenCalledWith(true);
  });

  it('shows a pinned panel beside the page, with nothing over the page to put it away', () => {
    draw({ isPanelOpen: true, isPanelPinned: true });

    expect(screen.getByText('The panel')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Put the panel away' })).toHaveLength(1);
  });

  it('puts a loose panel away when the page is touched', async () => {
    const { onPanelOpenChange } = draw({ isPanelOpen: true, isPanelPinned: false });

    const [, overThePage] = screen.getAllByRole('button', { name: 'Put the panel away' });

    if (overThePage !== undefined) {
      await userEvent.click(overThePage);
    }

    expect(onPanelOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the bars showing while the panel is out', () => {
    draw({ isShown: false, isPanelOpen: true, isPanelPinned: true });

    expect(screen.getByRole('banner', { hidden: true })).not.toHaveClass('pointer-events-none');
  });

  it('has no edges to turn from where the page is a strip to scroll', () => {
    draw({ isScrolling: true });

    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous page' })).not.toBeInTheDocument();
  });
  it('offers no full screen where the browser will not allow it', () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });
    draw();

    expect(screen.queryByRole('button', { name: 'Fill the screen' })).not.toBeInTheDocument();
  });

  it('offers to fill the screen where the browser will allow it', () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    draw();

    expect(screen.getByRole('button', { name: 'Fill the screen' })).toBeInTheDocument();
  });

  it('draws an arrow in each edge, faded with the bars but still pressable', async () => {
    const { onForward } = draw({ isShown: false });

    const next = screen.getByRole('button', { name: 'Next page' });

    expect(next.querySelector('svg')).toHaveClass('opacity-0');

    await userEvent.click(next);

    expect(onForward).toHaveBeenCalledOnce();
  });
});
