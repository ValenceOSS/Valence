import { ActivityIndicator } from 'react-native';
import { AShow } from '@ValenceMobile/components/AShow/AShow';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { useTheProgrammeOf } from '@ValenceMobile/components/SignedIn/useTheProgrammeOf';
import type { AProgrammeBySeriesProps } from './AProgrammeBySeries.types';

/**
 * A programme's page, found by the series it belongs to, for whatever knows a series and not where
 * the library keeps it — a request that has arrived, a notification.
 *
 * @param seriesId - The series.
 * @param onWatch - Told to play an episode, and from where.
 * @param onLookAt - Told to open an episode's own page.
 * @param onBack - Told somebody is done with it.
 * @param onRequestMore - Told to open the programme's catalogue page to ask for more of it.
 */
const AProgrammeBySeries = ({
  seriesId,
  onWatch,
  onLookAt,
  onBack,
  onRequestMore,
}: AProgrammeBySeriesProps) => {
  const sought = useTheProgrammeOf(seriesId);

  return sought === null ? (
    <Screen centres onBack={onBack}>
      <ActivityIndicator />
    </Screen>
  ) : (
    <AShow
      libraryId={sought.libraryId}
      showId={sought.showId}
      onWatch={onWatch}
      onLookAt={onLookAt}
      onBack={onBack}
      {...(onRequestMore === undefined ? {} : { onRequestMore })}
    />
  );
};

AProgrammeBySeries.displayName = 'AProgrammeBySeries';

export { AProgrammeBySeries };
