import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeckMark } from './DeckMark';

describe('DeckMark', () => {
  it('draws three cards in the square it is given', () => {
    const { container } = render(<DeckMark size={84} />);
    const mark = container.firstElementChild;

    expect(mark).toHaveStyle({ width: '84px', height: '84px' });
    expect(mark?.firstElementChild?.children).toHaveLength(3);
  });

  it('inks the front card in the text colour and fades the two behind it', () => {
    const { container } = render(<DeckMark size={84} />);
    const cards = [...(container.firstElementChild?.firstElementChild?.children ?? [])];

    expect(cards.at(-1)).toHaveStyle({ background: 'var(--color-text)' });
    expect(cards[0]?.getAttribute('style')).toContain('14%');
    expect(cards[1]?.getAttribute('style')).toContain('28%');
  });

  it('is a picture with a name where it is given one', () => {
    render(<DeckMark size={40} label="Valence" />);

    expect(screen.getByRole('img', { name: 'Valence' })).toBeInTheDocument();
  });

  it('is hidden from assistive technology where it has no name', () => {
    const { container } = render(<DeckMark size={40} />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('is drawn fanned out at once where it is not asked to move', () => {
    const { container } = render(<DeckMark size={84} />);
    const cards = [...(container.firstElementChild?.firstElementChild?.children ?? [])];
    const transforms = new Set(cards.map((card) => card.getAttribute('style')));

    expect(transforms.size).toBe(3);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DeckMark.displayName).toBe('DeckMark');
  });
});
