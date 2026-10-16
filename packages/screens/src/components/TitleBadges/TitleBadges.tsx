import { AgeRating } from '@ValenceUI/AgeRating';
import { Badge } from '@ValenceUI/Badge';
import { cn } from '@ValenceUI/cn';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { sayContains } from '@ValenceClient/library/sayContains';
import type { TitleBadgesProps } from './TitleBadges.types';

/**
 * What a title is certified as and how it looks and sounds, in one row beneath its facts — its
 * certificate as the board that issued it publishes it, then 4K, Dolby Vision, Atmos, 5.1 as
 * outlined badges, as a streaming service lays them out — and what it contains, where the catalogue
 * says.
 *
 * @param detail - Everything known about the title, or nothing while it is still being read.
 * @param className - Extra classes for the caller's own layout.
 */
const TitleBadges = ({ detail, className }: TitleBadgesProps) => {
  if (detail === null) {
    return null;
  }

  const certification = detail.metadata.certification ?? null;
  const region = detail.metadata.certificationRegion ?? null;
  const badges = qualityBadges(detail);
  const contains = sayContains(detail.metadata.advisories);

  if ((certification === null || region === null) && badges.length === 0 && contains === null) {
    return null;
  }

  return (
    <span className={cn('flex flex-wrap items-center gap-2', className)}>
      {certification === null || certification === '' || region === null ? null : (
        <AgeRating certification={certification} region={region} />
      )}

      {badges.map((badge) => (
        <Badge key={badge} tone="quiet">
          {badge}
        </Badge>
      ))}

      {contains === null ? null : <span className="text-xs text-text-muted">{contains}</span>}
    </span>
  );
};

TitleBadges.displayName = 'TitleBadges';

export { TitleBadges };
