import { Play } from '@keyline-icons/react-native/fill';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { AChoiceMenu } from '@ValenceMobile/components/AChoiceMenu/AChoiceMenu';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { APlayerPanel } from '@ValenceMobile/components/Watching/components/APlayerPanel/APlayerPanel';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { howLongItRuns } from '@ValenceMobile/components/ATitle/howLongItRuns';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { numberedEpisodeTitle } from '@ValenceCore/functions/numberedEpisodeTitle';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { TheEpisodesProps } from './TheEpisodes.types';
import { say } from '@ValenceI18n/say';

const STILL_WIDE = 260;

const styles = StyleSheet.create({
  card: { gap: 8, width: STILL_WIDE },
  cardTitle: { color: PLAYER_LOOK.colours.text, fontFamily: FONTS.sans.bold, fontSize: 15 },
  heading: { ...PLAYER_LOOK.styles.heading, marginBottom: 14 },
  seasons: { alignSelf: 'flex-start', marginBottom: 10 },
  now: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  nowLabel: {
    color: PLAYER_LOOK.colours.text,
    fontFamily: FONTS.sans.bold,
    fontSize: 13,
    marginTop: 6,
  },
  picture: { height: '100%', width: '100%' },
  row: { gap: 16, paddingRight: 24, paddingTop: 22 },
  still: {
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    overflow: 'hidden',
    width: STILL_WIDE,
  },
  stillChosen: { borderColor: PLAYER_LOOK.colours.text, borderWidth: 2 },
  whole: { flex: 1, justifyContent: 'center' },
});

/**
 * The programme's episodes while one of them plays: the system's own menu for its seasons, opening
 * on the season this one is in, and the episodes of that season as stills along a line, the one playing
 * marked, so the next one is found by looking rather than by reading a list of numbers.
 *
 * @param seasons - The programme's seasons and their episodes.
 * @param playing - The episode playing.
 * @param onChoose - Told which episode they picked.
 * @param onClose - Told they are done.
 */
const TheEpisodes = ({ seasons, playing, onChoose, onClose }: TheEpisodesProps) => {
  const inSeason = Math.max(
    0,
    seasons.findIndex((season) => season.episodes.some((episode) => episode.id === playing)),
  );
  const [shown, setShown] = useState(inSeason);
  const season = seasons[shown] ?? seasons[0];

  return (
    <APlayerPanel label={say('phone.watching.closeTheEpisodes')} onClose={onClose}>
      <View style={styles.whole}>
        {seasons.length > 1 ? (
          <View style={styles.seasons}>
            <AChoiceMenu
              label={say('common.season')}
              isDark
              items={seasons.map((one, at) => ({
                id: at.toString(),
                label: nameSeason(one.seasonNumber),
              }))}
              value={shown.toString()}
              onSelect={(id) => {
                setShown(Number(id));
              }}
            />
          </View>
        ) : (
          <Text style={styles.heading}>{say('common.episodes')}</Text>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {(season?.episodes ?? []).map((episode) => {
            const isPlaying = episode.id === playing;

            return (
              <Button
                key={episode.id}
                tone="bare"
                label={episode.title}
                onPress={() => {
                  onChoose(episode.id);
                }}
              >
                <View style={styles.card}>
                  <View style={[styles.still, isPlaying && styles.stillChosen]}>
                    {episode.hasBackdrop ? (
                      <ARemotePicture
                        style={styles.picture}
                        uri={onThisServer(`/api/media/${episode.id}/image/backdrop`)}
                      />
                    ) : null}

                    {isPlaying ? (
                      <View style={styles.now}>
                        <Icon of={Play} size={26} colour={PLAYER_LOOK.colours.text} />
                        <Text style={styles.nowLabel}>{say('phone.watching.playingNow')}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {numberedEpisodeTitle(
                      episode.title,
                      episode.episodeNumber,
                      episode.episodeNumberEnd,
                    )}
                  </Text>

                  <Text style={PLAYER_LOOK.styles.small}>
                    {howLongItRuns(episode.durationSeconds)}
                  </Text>
                </View>
              </Button>
            );
          })}
        </ScrollView>
      </View>
    </APlayerPanel>
  );
};

TheEpisodes.displayName = 'TheEpisodes';

export { TheEpisodes };
