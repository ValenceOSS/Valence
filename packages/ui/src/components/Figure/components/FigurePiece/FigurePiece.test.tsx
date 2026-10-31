import { render, waitFor } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, it } from 'vitest';
import { FIGURE_LAYERS } from '@ValenceUI/FIGURE_LAYERS';
import { FigurePiece } from './FigurePiece';

const drawing = FIGURE_LAYERS.yours;

describe('FigurePiece', () => {
  it('paints its lines through a mask, with the outline of each layer above it cut out', () => {
    const [body] = drawing.pieces;
    const { container } = render(
      body === undefined ? null : (
        <FigurePiece piece={body} drawing={drawing} spread={motionValue(0)} />
      ),
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';

    expect(container.firstElementChild).toHaveClass('bg-current');
    expect(style).toContain(body?.lines ?? 'missing');
    expect(style).toContain(drawing.layers[1]?.silhouette ?? 'missing');
  });

  it('keeps guides to the reach below the part they climb to', () => {
    const guides = drawing.pieces.find((piece) => piece.reach !== undefined);
    const { container } = render(
      guides === undefined ? null : (
        <FigurePiece piece={guides} drawing={drawing} spread={motionValue(0)} />
      ),
    );

    expect(container.firstElementChild?.getAttribute('style')).toContain(
      guides?.reach?.file ?? 'missing',
    );
  });

  it('rests in place, and climbs along its drift as the figure spreads open', async () => {
    const lid = drawing.pieces.find((piece) => piece.moves === 1 && piece.reach === undefined);
    const spread = motionValue(0);
    const { container } = render(
      lid === undefined ? null : <FigurePiece piece={lid} drawing={drawing} spread={spread} />,
    );
    const rise = ((drawing.layers[1]?.drift[1] ?? 0) / drawing.width) * 100;

    expect(container.firstElementChild?.getAttribute('style')).toMatch(
      /translate\(0(?:\.0+)?cqw, 0(?:\.0+)?cqw\)/u,
    );

    spread.set(1);

    await waitFor(() => {
      expect(container.firstElementChild?.getAttribute('style')).toContain(
        `${rise.toFixed(3)}cqw)`,
      );
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FigurePiece.displayName).toBe('FigurePiece');
  });
});
