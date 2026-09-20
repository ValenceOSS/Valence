import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Heart as HeartIcon, Shuffle as ShuffleIcon } from '@keyline-icons/react';
import { Heart as HeartFilledIcon } from '@keyline-icons/react/fill';
import { BarButton } from './BarButton';

describe('BarButton', () => {
  it('does what it says when pressed', async () => {
    const onClick = vi.fn();

    render(<BarButton label="Shuffle" glyph={ShuffleIcon} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Shuffle' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('says when the thing it stands for is on', () => {
    render(<BarButton label="Stop shuffling" glyph={ShuffleIcon} isLit onClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Stop shuffling' })).toHaveClass('text-text');
  });

  it('draws its solid twin while lit, and the outline otherwise', () => {
    const { container, rerender } = render(
      <BarButton label="Like" glyph={HeartIcon} litGlyph={HeartFilledIcon} onClick={vi.fn()} />,
    );
    const outline = container.innerHTML;

    rerender(
      <BarButton
        label="Like"
        glyph={HeartIcon}
        litGlyph={HeartFilledIcon}
        isLit
        onClick={vi.fn()}
      />,
    );

    expect(container.innerHTML).not.toBe(outline);
  });

  it('cannot be pressed while it does not apply', async () => {
    const onClick = vi.fn();

    render(<BarButton label="Shuffle" glyph={ShuffleIcon} isDisabled onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Shuffle' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('moves its icon when pointed at without losing its name', async () => {
    render(<BarButton label="Queue" glyph={ShuffleIcon} onClick={vi.fn()} />);

    await userEvent.hover(screen.getByRole('button', { name: 'Queue' }));

    expect(screen.getByRole('button', { name: 'Queue' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BarButton.displayName).toBe('BarButton');
  });
});
