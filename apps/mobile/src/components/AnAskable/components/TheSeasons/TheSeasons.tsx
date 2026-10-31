import { CircleCheck, Plus } from '@keyline-icons/react-native';
import { CircleCheck as CircleCheckFilled } from '@keyline-icons/react-native/fill';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { SEASON_STANDING_NAMES } from '@ValenceClient/requests/SEASON_STANDING_NAMES';
import { isSeasonHeld } from '@ValenceClient/requests/isSeasonHeld';
import { theSeasonsTicked } from '@ValenceClient/requests/theSeasonsTicked';
import { tickASeason } from '@ValenceClient/requests/tickASeason';
import { tickEverySeason } from '@ValenceClient/requests/tickEverySeason';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { pictureOnThisServer } from '@ValenceMobile/platform/pictureOnThisServer';
import { ASplitButton } from '@ValenceMobile/components/ASplitButton/ASplitButton';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { TheSeasonsProps } from './TheSeasons.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const styles = StyleSheet.create({
  cover: {
    alignItems: 'center',
    aspectRatio: 2 / 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
  },
  divided: { borderTopWidth: StyleSheet.hairlineWidth },
  picture: { height: '100%', width: '100%' },
  facts: { flex: 1, gap: 4 },
  head: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 12 },
  whole: { gap: 12 },
});

/**
 * Which of a programme's seasons to ask for, drawn as the library draws a programme's episodes: a
 * heading with a way to tick every regular season beside it, and a row for each season — its
 * poster, or its number where it has none, its name and what it holds, and a tick to ask for it —
 * ending with a row to get new seasons as they air.
 *
 * Specials are a row like any other and never part of every season, and following new seasons
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
  const isFollowing = isFollowedAlready || followsNew;

  if (listed.isPending) {
    return <ASpinner colour={colours.textMuted} />;
  }

  return (
    <View style={styles.whole}>
      <View style={styles.head}>
        <Words size="heading">{say('screens.seasonChooser.seasons')}</Words>

        <Button
          tone="ghost"
          icon={isEveryOne ? CircleCheckFilled : CircleCheck}
          isChosen={isEveryOne}
          onPress={() => {
            onChange(tickEverySeason(seasons, rows, !isEveryOne));
          }}
        >
          {say('common.everySeason')}
        </Button>
      </View>

      <View>
        {rows.map((row, place) => {
          const name = row.name ?? nameSeason(row.season);
          const isAsked = alreadyAsked.includes(row.season) || ticked.includes(row.season);

          return (
            <View
              key={row.season}
              style={[
                styles.row,
                place === 0
                  ? null
                  : [styles.divided, { borderTopColor: withAlpha(colours.text, 0.14) }],
              ]}
            >
              <View
                style={[
                  styles.cover,
                  { backgroundColor: colours.surfaceRaised, borderColor: colours.border },
                ]}
              >
                {row.posterUrl === null || row.posterUrl === undefined ? (
                  <Words size="title" tone="muted">
                    {row.season.toString()}
                  </Words>
                ) : (
                  <ARemotePicture style={styles.picture} uri={pictureOnThisServer(row.posterUrl)} />
                )}
              </View>

              <View style={styles.facts}>
                <Words lines={1}>{name}</Words>
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

              <ASplitButton
                parts={[
                  {
                    icon: isAsked ? CircleCheckFilled : CircleCheck,
                    label: name,
                    isChosen: isAsked,
                    isDisabled: alreadyAsked.includes(row.season) || isSeasonHeld(row),
                    onPress: () => {
                      onChange(tickASeason(seasons, rows, row.season));
                    },
                  },
                ]}
              />
            </View>
          );
        })}

        <View
          style={[
            styles.row,
            rows.length === 0
              ? null
              : [styles.divided, { borderTopColor: withAlpha(colours.text, 0.14) }],
          ]}
        >
          <View
            style={[
              styles.cover,
              { backgroundColor: colours.surfaceRaised, borderColor: colours.border },
            ]}
          >
            <Icon of={Plus} size={22} colour={colours.textMuted} />
          </View>

          <View style={styles.facts}>
            <Words lines={1}>{say('phone.theSeasons.newSeasons')}</Words>
            <Words size="small" tone="muted">
              {say('phone.theSeasons.fetchedAsEachOneAirs')}
            </Words>
          </View>

          <ASplitButton
            parts={[
              {
                icon: isFollowing ? CircleCheckFilled : CircleCheck,
                label: say('common.getNewSeasonsAsTheyCome'),
                isChosen: isFollowing,
                isDisabled: isFollowedAlready,
                onPress: () => {
                  onFollowsNew(!followsNew);
                },
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

TheSeasons.displayName = 'TheSeasons';

export { TheSeasons };
