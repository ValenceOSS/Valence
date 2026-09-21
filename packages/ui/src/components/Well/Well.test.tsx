import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Well } from './Well';

describe('Well', () => {
  it('holds what it is given', () => {
    render(
      <Well>
        <p>A chart</p>
      </Well>,
    );

    expect(screen.getByText('A chart')).toBeInTheDocument();
  });

  it('is rounded, drawn as a card’s background is, but is not a card', () => {
    const { container } = render(<Well>Content</Well>);

    expect(container.firstElementChild).toHaveClass('valence-well', 'rounded-xl');
    expect(container.querySelector('.valence-card-shell, .valence-card-face')).toBeNull();
  });

  it('has room inside it unless it is told to be flush', () => {
    const { container, rerender } = render(<Well>Content</Well>);

    expect(container.firstElementChild).toHaveClass('p-3');

    rerender(<Well isFlush>Content</Well>);

    expect(container.firstElementChild).not.toHaveClass('p-3');
  });

  it('takes the caller’s layout classes', () => {
    const { container } = render(<Well className="flex-1">Content</Well>);

    expect(container.firstElementChild).toHaveClass('flex-1');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Well.displayName).toBe('Well');
  });
});
