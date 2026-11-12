import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DotBar } from './DotBar';

const SEGMENTS = [
  { id: 'films', share: 0.6, colour: 'var(--color-accent)' },
  { id: 'shows', share: 0.4, colour: 'var(--color-success)' },
  { id: 'empty', share: 0, colour: 'var(--color-border)' },
];

describe('DotBar', () => {
  it('is read out as one picture by the label it is given', () => {
    render(<DotBar segments={SEGMENTS} label="How the disk is used" />);

    expect(screen.getByRole('img', { name: 'How the disk is used' })).toBeInTheDocument();
  });

  it('draws a block for each part with anything in it, as wide as its share', () => {
    render(<DotBar segments={SEGMENTS} label="Disk" />);
    const blocks = [...screen.getByRole('img').children];

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toHaveStyle({ flexBasis: '60%' });
    expect(blocks[1]).toHaveStyle({ flexBasis: '40%' });
  });

  it('dims every part but the lit one', () => {
    render(<DotBar segments={SEGMENTS} label="Disk" litId="shows" />);
    const [films, shows] = [...screen.getByRole('img').children];

    expect(films).toHaveClass('opacity-40');
    expect(shows).toHaveClass('opacity-100');
  });

  it('says which part the pointer is over, and nothing once it leaves', () => {
    const onPoint = vi.fn();

    render(<DotBar segments={SEGMENTS} label="Disk" onPoint={onPoint} />);
    const bar = screen.getByRole('img');

    fireEvent.pointerEnter(bar.children[1] ?? bar);
    fireEvent.pointerLeave(bar);

    expect(onPoint).toHaveBeenNthCalledWith(1, 'shows');
    expect(onPoint).toHaveBeenNthCalledWith(2, null);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DotBar.displayName).toBe('DotBar');
  });
});
