import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { ShelfMoreCardProps } from './ShelfMoreCard.types';

const CORNERS = 4;

const FACE = [
  'relative block aspect-[2/3] w-full overflow-hidden rounded-md',
  'valence-surface',
  'transition-shadow duration-[var(--duration-base)] ease-[var(--ease-out)]',
  'motion-reduce:transition-none',
  'hover-hover:group-hover/more:shadow-[var(--shadow-artwork-raised)]',
].join(' ');

/**
 * The card that ends a shelf: a few of what is on it behind, and the way through to all of it in
 * front. It is the last card rather than a link beside the title because that is where the eye
 * already is by the time the shelf runs out.
 *
 * @param label - What the shelf leads to, said to anybody who cannot see the card.
 * @param posterUrls - Artwork to lay behind, of which the first few are used.
 * @param onOpen - Told the card was pressed.
 */
const ShelfMoreCard = ({ label, posterUrls, onOpen }: ShelfMoreCardProps) => (
  <Button
    variant="bare"
    size="none"
    label={label}
    hasTooltip={false}
    onClick={onOpen}
    className="group/more w-full"
  >
    <span className={FACE}>
      <span aria-hidden className="absolute inset-0 grid grid-cols-2 gap-px opacity-45">
        {posterUrls.slice(0, CORNERS).map((posterUrl) => (
          <img
            key={posterUrl}
            src={posterUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ))}
      </span>

      <span className="absolute inset-0 bg-shade/45" />

      <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span
          className={cn(
            'flex size-14 items-center justify-center rounded-full bg-on-scrim text-shade',
            'transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)]',
            'motion-reduce:transition-none hover-hover:group-hover/more:scale-110',
          )}
        >
          <Icon of={ArrowRight01Icon} size={26} />
        </span>

        <span className="text-base font-semibold text-on-scrim">See more</span>
      </span>
    </span>
  </Button>
);

ShelfMoreCard.displayName = 'ShelfMoreCard';

export { ShelfMoreCard };
