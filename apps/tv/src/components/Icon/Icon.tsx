import { Children } from 'react';
import Svg, { Path } from 'react-native-svg';
import { z } from 'zod';
import type { ReactNode } from 'react';
import type { IconProps } from './Icon.types';

const CURRENT = 'currentColor';

const PaintSchema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.union([z.number(), z.string()]).optional(),
  strokeLinecap: z.enum(['butt', 'round', 'square']).optional(),
  strokeLinejoin: z.enum(['miter', 'round', 'bevel']).optional(),
  fillRule: z.enum(['nonzero', 'evenodd']).optional(),
  clipRule: z.enum(['nonzero', 'evenodd']).optional(),
  opacity: z.union([z.number(), z.string()]).optional(),
});

const DrawingSchema = z.object({
  props: PaintSchema.extend({ children: z.custom<ReactNode>() }),
});

const ShapeSchema = z.object({
  type: z.literal('path'),
  props: PaintSchema.extend({ d: z.string() }),
});

type Paint = z.infer<typeof PaintSchema>;

/**
 * A paint as the television draws it, with the icon's own "the colour of the text around it" put as
 * the colour asked for, since there is no text around a native drawing to take it from.
 *
 * @param paint - What the icon said.
 * @param colour - The colour asked for.
 * @returns The same paint, in that colour, holding only what the icon set.
 */
const inColour = (paint: Paint, colour: string) => ({
  ...(paint.fill === undefined ? {} : { fill: paint.fill === CURRENT ? colour : paint.fill }),
  ...(paint.stroke === undefined
    ? {}
    : { stroke: paint.stroke === CURRENT ? colour : paint.stroke }),
  ...(paint.strokeWidth === undefined ? {} : { strokeWidth: paint.strokeWidth }),
  ...(paint.strokeLinecap === undefined ? {} : { strokeLinecap: paint.strokeLinecap }),
  ...(paint.strokeLinejoin === undefined ? {} : { strokeLinejoin: paint.strokeLinejoin }),
  ...(paint.fillRule === undefined ? {} : { fillRule: paint.fillRule }),
  ...(paint.clipRule === undefined ? {} : { clipRule: paint.clipRule }),
  ...(paint.opacity === undefined ? {} : { opacity: paint.opacity }),
});

/**
 * One of Valence's icons, drawn natively: the one component that draws an icon on the television, as
 * ValenceUI's `Icon` is on the web.
 *
 * The icon itself is the web's — the Keyline component is asked what it draws, and the same paths
 * are drawn again with the television's own vector drawing, since a browser's `svg` means nothing to
 * a native screen. So an icon changes in one place, for every client, and nobody draws one by hand.
 *
 * @param of - Which icon.
 * @param size - How wide and tall it is.
 * @param colour - What colour it is drawn in.
 */
const Icon = ({ of, size = 32, colour }: IconProps) => {
  const drawing = DrawingSchema.safeParse(of({}));

  if (!drawing.success) {
    return null;
  }

  const { children, ...root } = drawing.data.props;
  const paths = Children.toArray(children).flatMap((child) => {
    const shape = ShapeSchema.safeParse(child);

    return shape.success ? [shape.data.props] : [];
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...inColour(root, colour)}>
      {paths.map((path) => (
        <Path key={path.d} {...inColour(path, colour)} d={path.d} />
      ))}
    </Svg>
  );
};

Icon.displayName = 'Icon';

export { Icon };
