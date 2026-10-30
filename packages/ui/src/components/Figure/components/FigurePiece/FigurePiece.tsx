import { motion, useTransform } from 'motion/react';
import type { FigureDrawing } from '@ValenceUI/Figure.types';
import type { FigureMask, FigurePieceProps } from './FigurePiece.types';

const WEBKIT_COMPOSITE = {
  add: 'source-over',
  subtract: 'source-out',
  intersect: 'source-in',
} as const satisfies Readonly<Record<FigureMask['composite'], string>>;

/**
 * Where one layer of a drawing sits, in its own units, for how far the drawing is spread open.
 *
 * @param drawing - The drawing the layer belongs to.
 * @param layer - Which layer.
 * @param spread - How far it is spread open, from 0 at rest to 1 fully open.
 * @returns How far across and down the layer sits from where it rests.
 */
const placeOf = (drawing: FigureDrawing, layer: number, spread: number) => {
  const [driftX, driftY] = drawing.layers[layer]?.drift ?? [0, 0];

  return [spread * driftX, spread * driftY] as const;
};

/**
 * Turns a length in a drawing's own units into one that scales with the figure's width.
 *
 * @param drawing - The drawing the length is in.
 * @param units - The length.
 * @returns The length in container-width units.
 */
const scaled = (drawing: FigureDrawing, units: number) =>
  `${((units / drawing.width) * 100).toFixed(3)}cqw`;

/**
 * One stacked piece of a figure, a layer's lines or the guides up to the next, painted through a
 * mask that moves with its layer and cuts out the layers in front of it as the figure spreads open.
 *
 * @param piece - Which piece of the drawing.
 * @param drawing - The drawing it belongs to.
 * @param spread - How far the figure is spread open, from 0 at rest to 1 fully open.
 */
const FigurePiece = ({ piece, drawing, spread }: FigurePieceProps) => {
  const masks: readonly FigureMask[] = [
    ...(piece.reach === undefined
      ? []
      : [{ file: piece.reach.file, follows: piece.reach.of, composite: 'intersect' as const }]),
    {
      file: piece.lines,
      follows: piece.moves,
      composite: piece.under.length === 0 ? ('add' as const) : ('subtract' as const),
    },
    ...piece.under.flatMap((layer) => {
      const silhouette = drawing.layers[layer]?.silhouette;

      return silhouette === undefined
        ? []
        : [{ file: silhouette, follows: layer, composite: 'add' as const }];
    }),
  ];
  const images = masks.map((mask) => `url("${mask.file}")`).join(', ');
  const composite = masks.map((mask) => mask.composite).join(', ');
  const webkitComposite = masks.map((mask) => WEBKIT_COMPOSITE[mask.composite]).join(', ');

  const transform = useTransform(spread, (open) => {
    const [x, y] = placeOf(drawing, piece.moves, open);

    return `translate(${scaled(drawing, x)}, ${scaled(drawing, y)})`;
  });
  const maskPosition = useTransform(spread, (open) => {
    const [ownX, ownY] = placeOf(drawing, piece.moves, open);

    return masks
      .map((mask) => {
        const [x, y] = placeOf(drawing, mask.follows, open);

        return `${scaled(drawing, x - ownX)} ${scaled(drawing, y - ownY)}`;
      })
      .join(', ');
  });

  return (
    <motion.span
      className="absolute inset-0 bg-current"
      style={{
        transform,
        maskImage: images,
        WebkitMaskImage: images,
        maskPosition,
        WebkitMaskPosition: maskPosition,
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskComposite: composite,
        WebkitMaskComposite: webkitComposite,
      }}
    />
  );
};

FigurePiece.displayName = 'FigurePiece';

export { FigurePiece };
