import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { SEASON_STANDING_NAMES } from '@ValenceClient/requests/SEASON_STANDING_NAMES';
import { theSeasonsTicked } from '@ValenceClient/requests/theSeasonsTicked';
import { tickASeason } from '@ValenceClient/requests/tickASeason';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheSeasonsProps } from './TheSeasons.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 6 },
  words: { flex: 1, gap: 2 },
});

/**
 * Which of a programme's seasons to ask for, a switch each and one for every season.
 *
 * Every season is held as every season rather than the ones there are today, so a programme still
 * running goes on being fetched as it airs.
 *
 * @param tmdbId - Which programme.
 * @param seasons - What is ticked, null for every season.
 * @param onChange - Told what is ticked now.
 */
const TheSeasons = ({ tmdbId, seasons, onChange }: TheSeasonsProps) => {
  const listed = useQuery(requestsQueries.seriesSeasons(tmdbId));
  const colours = useTheColours();
  const rows = listed.data ?? [];
  const ticked = theSeasonsTicked(seasons, rows);

  if (listed.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.words}>
          <Words>{say('phone.theSeasons.everySeason')}</Words>
          <Words size="small" tone="muted">
            {say('phone.theSeasons.andAnyToCome')}
          </Words>
        </View>

        <Toggle
          label={say('phone.theSeasons.everySeason')}
          isOn={seasons === null}
          onToggle={(isOn) => {
            onChange(isOn ? null : []);
          }}
        />
      </View>

      {rows.map((row) => (
        <View key={row.season} style={styles.row}>
          <View style={styles.words}>
            <Words>{nameSeason(row.season)}</Words>
            <Words size="small" tone="muted">
              {[
                sayCount('phone.theSeasons.episodes', row.episodeCount),
                row.firstAired?.slice(0, 4) ?? null,
                SEASON_STANDING_NAMES[row.standing],
              ]
                .filter((part) => part !== null)
                .join(' · ')}
            </Words>
          </View>

          <Toggle
            label={nameSeason(row.season)}
            isOn={ticked.includes(row.season)}
            onToggle={() => {
              onChange(tickASeason(seasons, rows, row.season));
            }}
          />
        </View>
      ))}
    </View>
  );
};

TheSeasons.displayName = 'TheSeasons';

export { TheSeasons };
