import { Button } from '@ValenceUI/Button';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { cn } from '@ValenceUI/cn';
import type { StudiosRailProps } from './StudiosRail.types';
import { say } from '@ValenceI18n/say';

const TILE = [
  'flex h-24 w-full items-center justify-center rounded-lg px-6',
  'valence-surface valence-hoverable',
  'transition-[transform,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out)]',
  'motion-reduce:transition-none',
  'hover-hover:hover:-translate-y-0.5 hover-hover:hover:shadow-[var(--shadow-lifted)]',
].join(' ');

const MARK = [
  'max-h-12 w-auto max-w-full object-contain',
  'opacity-80 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)]',
  'motion-reduce:transition-none hover-hover:group-hover/studio:opacity-100',
  'valence-mark-ink',
].join(' ');

/**
 * The studios, drawn as their marks rather than their names, so the row is read the way a shelf of
 * logos is. Choosing one shows everything of theirs the catalogue lists.
 *
 * @param studios - The studios to show.
 * @param onOpen - Told which studio was chosen.
 */
const StudiosRail = ({ studios, onOpen }: StudiosRailProps) => (
  <Rail title={say('screens.studiosRail.title')} cards="wide" sizesCards>
    {studios.map((studio, at) => (
      <RevealItem key={studio.id} index={at} className="shrink-0 snap-start">
        <Button
          variant="bare"
          size="none"
          label={studio.name}
          hasTooltip={false}
          onClick={() => {
            onOpen(studio.id);
          }}
          className={cn('group/studio w-full', TILE)}
        >
          {studio.logoUrl === null ? (
            <span className="text-sm font-semibold text-text">{studio.name}</span>
          ) : (
            <img src={studio.logoUrl} alt={studio.name} loading="lazy" className={MARK} />
          )}
        </Button>
      </RevealItem>
    ))}
  </Rail>
);

StudiosRail.displayName = 'StudiosRail';

export { StudiosRail };
