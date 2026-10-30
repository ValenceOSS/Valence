import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Figure } from './Figure';

describe('Figure', () => {
  it('is drawn through a mask of its drawing, in the shape of the drawing', () => {
    const { container } = render(<Figure of="linkedServers" className="w-full" />);
    const drawing = container.firstElementChild;

    expect(drawing).toHaveClass('pointer-events-none', 'bg-current', 'aspect-[560/361]', 'w-full');
    expect(drawing?.getAttribute('style')).toMatch(/mask-image/u);
  });

  it('stays out of the reading order without a label', () => {
    const { container } = render(<Figure of="linkedServers" />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('says what it shows where it is given a label', () => {
    render(<Figure of="linkedServers" label="Two servers joined by a signed link" />);

    expect(
      screen.getByRole('img', { name: 'Two servers joined by a signed link' }),
    ).toBeInTheDocument();
  });

  it('starts undrawn until it has been scrolled to', () => {
    const { container } = render(<Figure of="linkedServers" />);

    expect(container.firstElementChild?.getAttribute('style')).toMatch(/--drawn: -12%/u);
  });

  it.each(['yours', 'media', 'share'] as const)(
    'draws the %s figure in the shape the figure row gives each of its drawings',
    (name) => {
      const { container } = render(<Figure of={name} />);
      const drawing = container.firstElementChild;

      expect(drawing).toHaveClass('aspect-[400/320]');
      expect(drawing?.getAttribute('style')).toMatch(/mask-image/u);
    },
  );

  it('sets a display name so devtools can identify it', () => {
    expect(Figure.displayName).toBe('Figure');
  });
});
