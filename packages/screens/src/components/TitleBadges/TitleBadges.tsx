import { AgeRating } from '@ValenceUI/AgeRating';
import { Badge } from '@ValenceUI/Badge';
import { cn } from '@ValenceUI/cn';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { sayContains } from '@ValenceClient/library/sayContains';
import type { TitleBadgesProps } from './TitleBadges.types';

/**
 * What a title is certified as and how it looks and sounds, in one row beneath its facts — its
 * certificate as the board that issued it publishes it, then 4K, Dolby Vision, Atmos, 5.1 as
 * outlined badges, as a streaming service lays them out — and beneath them, on a row of its own,
 * what it contains, where the catalogue says.
 *
 * @param detail - Everything known about the title, or nothing while it is still being read.
 * @param isBrief - Whether to leave out the sentence of what it contains, where room is short.
 * @param className - Extra classes for the caller's own layout.
 */
const TitleBadges = ({ detail, isBrief = false, className }: TitleBadgesProps) => {
  if (detail === null) {
    return null;
  }

  const certification = detail.metadata.certification ?? null;
  const region = detail.metadata.certificationRegion ?? null;
  const badges = qualityBadges(detail);
  const contains = isBrief ? null : sayContains(detail.metadata.advisories);

  if ((certification === null || region === null) && badges.length === 0 && contains === null) {
    return null;
  }

  const row =
    (certification === null || certification === '' || region === null) &&
    badges.length === 0 ? null : (
      <span className={cn('flex items-center gap-2', isBrief ? 'flex-nowrap' : 'flex-wrap')}>
        {certification === null || certification === '' || region === null ? null : (
          <AgeRating certification={certification} region={region} />
        )}

        {badges.map((badge) => (
          <Badge key={badge} tone="bright">
            {badge}
          </Badge>
        ))}
      </span>
    );

  return (
    <span className={cn('flex flex-col items-start gap-2', className)}>
      {row}
      {contains === null ? null : <span className="text-xs text-text-muted">{contains}</span>}
    </span>
  );
};

TitleBadges.displayName = 'TitleBadges';

export { TitleBadges };
