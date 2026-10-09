import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { SEASON_STANDING_NAMES } from '@ValenceClient/requests/SEASON_STANDING_NAMES';
import { isSeasonHeld } from '@ValenceClient/requests/isSeasonHeld';
import { theSeasonsTicked } from '@ValenceClient/requests/theSeasonsTicked';
import { tickASeason } from '@ValenceClient/requests/tickASeason';
import { tickEverySeason } from '@ValenceClient/requests/tickEverySeason';
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
 * Which of a programme's seasons to ask for: a switch each, one for every regular season, and one
 * to get new seasons as they come.
 *
 * Specials are a switch like any other and never part of every season, and following new seasons
 * is a choice of its own. A season the library already holds whole is locked, as there is nothing in
 * it to ask for. Adding to a request already made, the seasons it asks for are locked on, and so is
 * following new seasons where it follows them already.
 *
 * @param tmdbId - Which programme.
 * @param seasons - What is ticked, null for every regular season.
 * @param onChange - Told what is ticked now.
 * @param followsNew - Whether seasons that air later are fetched too.
 * @param onFollowsNew - Told whether they are as it changes.
 * @param alreadyAsked - The seasons a request already made asks for, where seasons are being added.
 * @param isFollowedAlready - Whether that request already gets new seasons as they come.
 */
const TheSeasons = ({
  tmdbId,
  seasons,
  onChange,
  followsNew,
  onFollowsNew,
  alreadyAsked = [],
  isFollowedAlready = false,
}: TheSeasonsProps) => {
  const listed = useQuery(requestsQueries.seriesSeasons(tmdbId));
  const colours = useTheColours();
  const rows = listed.data ?? [];
  const ticked = theSeasonsTicked(seasons, rows);
  const open = rows.filter((row) => row.season > 0 && !isSeasonHeld(row));
  const isEveryOne =
    seasons === null ||
    (open.length > 0 &&
      open.every((row) => ticked.includes(row.season) || alreadyAsked.includes(row.season)));

  if (listed.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.words}>
          <Words>{say('common.everySeason')}</Words>
        </View>

        <Toggle
          label={say('common.everySeason')}
          isOn={isEveryOne}
          onToggle={(isOn) => {
            onChange(tickEverySeason(seasons, rows, isOn));
          }}
        />
      </View>

      {rows.map((row) => (
        <View key={row.season} style={styles.row}>
          <View style={styles.words}>
            <Words>{nameSeason(row.season)}</Words>
            <Words size="small" tone="muted">
              {[
                sayCount('common.count.episodes', row.episodeCount),
                row.firstAired?.slice(0, 4) ?? null,
                SEASON_STANDING_NAMES[row.standing],
              ]
                .filter((part) => part !== null)
                .join(' · ')}
            </Words>
          </View>

          <Toggle
            label={nameSeason(row.season)}
            isOn={alreadyAsked.includes(row.season) || ticked.includes(row.season)}
            isDisabled={alreadyAsked.includes(row.season) || isSeasonHeld(row)}
            onToggle={() => {
              onChange(tickASeason(seasons, rows, row.season));
            }}
          />
        </View>
      ))}

      <View style={styles.row}>
        <View style={styles.words}>
          <Words>{say('common.getNewSeasonsAsTheyCome')}</Words>
          <Words size="small" tone="muted">
            {say('common.fetchesEachNewSeasonAsIt')}
          </Words>
        </View>

        <Toggle
          label={say('common.getNewSeasonsAsTheyCome')}
          isOn={isFollowedAlready || followsNew}
          isDisabled={isFollowedAlready}
          onToggle={onFollowsNew}
        />
      </View>
    </View>
  );
};

TheSeasons.displayName = 'TheSeasons';

export { TheSeasons };
