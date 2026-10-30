import { fireEvent, render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { describe, expect, it } from 'vitest';
import { FIGURE_LAYERS } from '@ValenceUI/FIGURE_LAYERS';
import { Figure } from './Figure';

describe('Figure', () => {
  it('is drawn in the shape of its drawing, at the size the caller gives it', () => {
    const { container } = render(<Figure of="linkedServers" className="w-full" />);

    expect(container.firstElementChild).toHaveClass('@container', 'aspect-[560/418]', 'w-full');
  });

  it.each(['linkedServers', 'yours', 'media', 'share'] as const)(
    'stacks every piece of the %s drawing, each painted through a mask in the colour of the text',
    (name) => {
      const { container } = render(<Figure of={name} />);
      const pieces = container.querySelectorAll('.bg-current');

      expect(pieces).toHaveLength(FIGURE_LAYERS[name].pieces.length);
      pieces.forEach((piece) => {
        expect(piece.getAttribute('style')).toMatch(/mask-image/u);
      });
    },
  );

  it('gives the three figures of the row one shape between them', () => {
    expect(
      new Set([FIGURE_LAYERS.yours.shape, FIGURE_LAYERS.media.shape, FIGURE_LAYERS.share.shape]),
    ).toEqual(new Set(['aspect-[400/380]']));
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

    expect(container.firstElementChild?.firstElementChild?.getAttribute('style')).toMatch(
      /--drawn: -12%/u,
    );
  });

  it('answers the pointer, and rests with its parts in place until it moves', () => {
    const { container } = render(<Figure of="yours" />);
    const figure = container.firstElementChild;

    expect(figure).not.toHaveClass('pointer-events-none');
    expect(container.querySelectorAll('.bg-current')[1]?.getAttribute('style')).toMatch(
      /translate\(0(?:\.0+)?cqw, 0(?:\.0+)?cqw\)/u,
    );

    if (figure !== null) {
      fireEvent.pointerEnter(figure, { pointerType: 'mouse' });
      fireEvent.pointerLeave(figure, { pointerType: 'mouse' });
      fireEvent.pointerUp(figure, { pointerType: 'touch' });
    }

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is drawn whole and held still for someone who has asked for less motion', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <Figure of="media" />
      </MotionConfig>,
    );
    const figure = container.firstElementChild;

    expect(figure).toHaveClass('pointer-events-none');
    expect(figure?.firstElementChild?.getAttribute('style')).toMatch(/--drawn: 112%/u);
    container.querySelectorAll('.bg-current').forEach((piece) => {
      expect(piece.getAttribute('style')).toMatch(/translate\(0(?:\.0+)?cqw, 0(?:\.0+)?cqw\)/u);
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Figure.displayName).toBe('Figure');
  });
});
