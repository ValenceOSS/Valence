import { Logo } from '@ValenceUI/Logo';
import { cn } from '@ValenceUI/cn';
import type { MarkLayersProps } from './MarkLayers.types';

const LAYERS = ['top', 'middle', 'base'] as const;

/**
 * The mark with one of its three layers picked out and the other two faded back, to say which part
 * of it is being talked about.
 *
 * @param lit - The layer to pick out.
 * @param className - How large it is and the colour it is drawn in.
 */
const MarkLayers = ({ lit, className }: MarkLayersProps) => (
  <span
    aria-hidden
    style={{ aspectRatio: (140 / 132).toString() }}
    className={cn('relative inline-block', className)}
  >
    {LAYERS.map((layer) => (
      <Logo
        key={layer}
        src={`/valence-layers-${layer}.svg`}
        isCurrentColour
        className={cn('absolute inset-0 h-full', layer === lit ? '' : 'opacity-20')}
      />
    ))}
  </span>
);

MarkLayers.displayName = 'MarkLayers';

export { MarkLayers };
