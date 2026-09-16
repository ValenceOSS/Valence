import { Card } from '@ValenceUI/Card';
import { RevealItem } from '@ValenceUI/RevealItem';
import { cn } from '@ValenceUI/cn';
import { FeatureVisual } from './components/FeatureVisual/FeatureVisual';
import type { FeatureCardProps } from './FeatureCard.types';

/**
 * One feature, in a grid of them, arriving in place after the ones before it and lifting to meet a
 * pointer that lingers over it. The first feature of a group leads the rest, drawn full width and
 * bolder, so the grid reads as a bento of differently-weighted tiles rather than a list in boxes.
 *
 * @param feature - What it is and why it matters.
 * @param index - Where it sits in the grid, so it arrives in order.
 * @param isFeatured - Whether this is the one card in its group that leads, drawn wider and bolder.
 */
const FeatureCard = ({ feature, index, isFeatured = false }: FeatureCardProps) => (
  <RevealItem index={index} className={cn('list-none', isFeatured ? 'col-span-full' : '')}>
    <Card
      as="article"
      tone="glass"
      radius="xl"
      padding="none"
      isInteractive
      className={cn(
        'group flex h-full flex-col overflow-hidden',
        'hover-hover:hover:ring-1 hover-hover:hover:ring-accent/40',
        isFeatured ? 'sm:flex-row' : '',
      )}
    >
      <div className={cn('h-40 p-3', isFeatured ? 'sm:h-auto sm:w-64 sm:shrink-0 sm:p-4' : '')}>
        <FeatureVisual kind={feature.visual} icon={feature.icon} />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-2 p-6 pt-3 sm:pt-3">
        <h3 className={cn('font-semibold text-text', isFeatured ? 'text-2xl' : 'text-lg')}>
          {feature.title}
        </h3>

        <p className="text-sm leading-relaxed text-text-muted">{feature.detail}</p>
      </div>
    </Card>
  </RevealItem>
);

FeatureCard.displayName = 'FeatureCard';

export { FeatureCard };
