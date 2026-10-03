import { StarRating } from '@ValenceUI/StarRating';
import { useQuery } from '@tanstack/react-query';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { useStars } from '@ValenceClient/library/useStars';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import type { HouseholdRating } from '@ValenceContracts/schemas/Rating';
import type { RatingPanelProps } from './RatingPanel.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const NOTHING: HouseholdRating = { average: null, count: 0 };

/**
 * What this viewer thinks of something and what the rest of the household thinks, side by side. The
 * viewer's row is pressable and the household's is not — one is an opinion being given, the other is
 * everyone's opinions already given, and they are different things wearing the same stars.
 *
 * Re-reads the household figure whenever this viewer's rating changes, since their own rating is
 * part of that average and a figure that ignored the star just pressed would look broken.
 *
 * Reads its own star rather than being handed one. Handed down, the star had to be looked up by
 * whoever drew the dialog — which meant the shell subscribing to every rating in the library in
 * order to find one, and redrawing the page behind the dialog each time a star was pressed. Asked
 * for here, and narrowed to this subject, the only thing a press redraws is this panel. Read for the
 * profile being watched as, which is whose ratings a press writes, so the star it fills is this one.
 *
 * @param subject - The item, programme or book being rated.
 * @param title - What is being rated, for anybody not looking at the screen.
 * @param onRate - Called with what they gave it, or null to take it back.
 * @param className - Extra classes for the caller's own layout.
 */
const RatingPanel = ({ subject, title, onRate, className }: RatingPanelProps) => {
  const stars = useStars(useWatchingProfile(), subject);

  const asked = useQuery(viewingQueries.household(subject));

  const household = asked.data ?? NOTHING;

  return (
    <DialogSection
      heading={say('screens.ratingPanel.ratings')}
      {...(className === undefined ? {} : { className })}
    >
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">
            {say('screens.ratingPanel.you')}
          </span>

          <StarRating
            stars={stars}
            label={title}
            onRate={(given) => {
              onRate(given);
            }}
            onClear={() => {
              onRate(null);
            }}
          />
        </div>

        {household.average === null ? null : (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">
              {say('screens.ratingPanel.household')}
            </span>

            <span className="flex items-center gap-2">
              <StarRating
                stars={household.average}
                label={say('screens.ratingPanel.titleHousehold', { title })}
                size="sm"
              />
              <span className="text-sm tabular-nums text-text">{household.average.toFixed(1)}</span>
              <span className="font-body text-xs text-text-muted">
                {sayCount('screens.ratingPanel.fromCountRating', household.count)}
              </span>
            </span>
          </div>
        )}
      </div>
    </DialogSection>
  );
};

RatingPanel.displayName = 'RatingPanel';

export { RatingPanel };
