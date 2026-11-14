import { haloFor } from '@ValenceClient/playback/haloFor';

const DARK_INK = /rgba\(0, 0, 0, (?<strength>[\d.]+)\)/g;

/**
 * Inks the viewer's edge round a run of a sign's lettering in the colour that lettering needs, so
 * that dark lettering is ringed in light rather than lost in a dark edge of its own. The edge keeps
 * the shape and thickness the viewer chose, and only its dark ink is changed.
 *
 * @param edge - The viewer's edge, as the `text-shadow` that draws it.
 * @param colour - The lettering's colour as `#rrggbb`, or nothing where it is the viewer's own.
 * @returns The edge, as the `text-shadow` that draws it.
 */
const haloEdge = (edge: string, colour: string | null): string => {
  const halo = haloFor(colour);
  const channels = [1, 3, 5]
    .map((at) => Number.parseInt(halo.slice(at, at + 2), 16).toString())
    .join(', ');

  return edge.replaceAll(DARK_INK, (_ink, strength: string) => `rgba(${channels}, ${strength})`);
};

export { haloEdge };
