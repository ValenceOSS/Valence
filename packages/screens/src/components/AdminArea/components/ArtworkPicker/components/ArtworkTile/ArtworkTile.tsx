import { Button } from '@ValenceUI/Button';
import { Badge } from '@ValenceUI/Badge';
import { Spinner } from '@ValenceUI/Spinner';
import { cn } from '@ValenceUI/cn';
import type { ArtworkTileProps } from './ArtworkTile.types';
import { say } from '@ValenceI18n/say';

const SHAPES = {
  poster: 'aspect-[2/3]',
  backdrop: 'aspect-video',
  logo: 'aspect-video',
} as const;

/**
 * One picture an administrator can choose for a title, drawn in the shape it will be shown in and
 * ringed while it is the one chosen. A logo is set on a darkened panel and fitted whole, since its
 * lettering is usually light and has no background of its own. With no picture it stands for going
 * back to the catalogue's own pick.
 *
 * @param kind - Which kind of picture, which decides its shape.
 * @param label - What pressing it chooses, for somebody who cannot see it.
 * @param previewUrl - A small copy of the picture, or null for the catalogue's own pick.
 * @param note - A few words shown on it, such as the language its lettering is in.
 * @param isChosen - Whether it is the picture in use.
 * @param isBusy - Whether choosing it is under way.
 * @param onChoose - Told it was chosen.
 */
const ArtworkTile = ({
  kind,
  label,
  previewUrl,
  note,
  isChosen,
  isBusy,
  onChoose,
}: ArtworkTileProps) => (
  <Button
    variant="bare"
    size="none"
    label={label}
    hasTooltip={false}
    isActive={isChosen}
    onClick={onChoose}
    className={cn(
      'group relative block w-full overflow-hidden rounded-lg ring-1 ring-line',
      'transition-shadow duration-[var(--duration-fast)] ease-[var(--ease-out)] motion-reduce:transition-none',
      isChosen ? 'ring-[3px] ring-accent' : 'hover-hover:hover:ring-[var(--surface-divider)]',
      SHAPES[kind],
      kind === 'logo' || previewUrl === null ? 'bg-surface-raised' : 'bg-card',
    )}
  >
    {previewUrl === null ? (
      <span className="flex h-full w-full items-center justify-center px-3 text-center text-sm font-medium text-text">
        {say('screens.artworkPicker.artworkTile.theCataloguesPick')}
      </span>
    ) : (
      <img
        src={previewUrl}
        alt=""
        loading="lazy"
        draggable={false}
        className={cn('h-full w-full', kind === 'logo' ? 'object-contain p-4' : 'object-cover')}
      />
    )}

    <span className="absolute bottom-2 left-2">
      <Badge tone={isChosen ? 'accent' : 'solid'} size="sm">
        {isChosen ? say('screens.artworkPicker.artworkTile.chosen') : note}
      </Badge>
    </span>

    {isBusy ? (
      <span className="absolute inset-0 flex items-center justify-center bg-scrim">
        <Spinner size="md" label={say('screens.artworkPicker.artworkTile.choosingThisPicture')} />
      </span>
    ) : null}
  </Button>
);

ArtworkTile.displayName = 'ArtworkTile';

export { ArtworkTile };
