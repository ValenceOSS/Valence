import { BarList } from '@ValenceUI/BarList';
import { say } from '@ValenceI18n/say';
import type { MostWatchedListProps } from './MostWatchedList.types';

/**
 * The titles watched most over a range, a series counted once for all its episodes, each with a bar
 * as long as its share of the most watched and how long it was watched for.
 *
 * @param titles - The titles, most watched first.
 * @param limit - How many to show.
 */
const MostWatchedList = ({ titles, limit = 10 }: MostWatchedListProps) => (
  <BarList
    label={say('screens.adminArea.mostWatchedList.mostWatched')}
    heading={say('common.title')}
    valueHeading={say('screens.importWizard.importReportView.plays')}
    emptyMessage={say('screens.adminArea.mostWatchedList.nothingWasWatched')}
    items={titles.slice(0, limit).map((title) => ({
      id: title.seriesId ?? title.mediaItemId,
      label: title.title,
      value: title.plays,
      ...(title.hours > 0
        ? {
            detail: say('screens.adminArea.mostWatchedList.hours', {
              hours: title.hours.toLocaleString(),
            }),
          }
        : {}),
    }))}
  />
);

MostWatchedList.displayName = 'MostWatchedList';

export { MostWatchedList };
