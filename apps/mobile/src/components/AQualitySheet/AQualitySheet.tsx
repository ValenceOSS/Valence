import { ScrollView, StyleSheet, View } from 'react-native';
import { crossfadeChoices } from '@ValenceClient/music/crossfadeChoices';
import { describeAudioQuality } from '@ValenceClient/music/describeAudioQuality';
import { levellingChoices } from '@ValenceClient/music/levellingChoices';
import { whatTheFileHolds } from '@ValenceClient/music/whatTheFileHolds';
import { AUDIO_QUALITIES } from '@ValenceContracts/schemas/Music';
import { ABottomSheet } from '@ValenceMobile/components/ABottomSheet/ABottomSheet';
import { ASheetChoice } from '@ValenceMobile/components/AQualitySheet/components/ASheetChoice/ASheetChoice';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import type { AQualitySheetProps } from './AQualitySheet.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  file: { paddingHorizontal: 4, paddingTop: 12 },
  heading: { paddingHorizontal: 4, paddingTop: 20 },
  whole: { gap: 4, paddingBottom: 12 },
});

/**
 * How the music sounds, chosen as the web's quality menu chooses it: the song's own file, or one of
 * the smaller ones made from it, each saying how many kilobits a second it takes and about how much
 * an hour of it costs, with what the song's own file holds beneath. Below it, whether songs are
 * levelled to one loudness, each on its own or each album as a whole, and how many seconds one song
 * fades into the next. A quality chosen puts the sheet away; the other two can be tried in turn.
 *
 * @param isOpen - Whether it is out.
 * @param onClose - Told to put it away.
 */
const AQualitySheet = ({ isOpen, onClose }: AQualitySheetProps) => {
  const { player, state } = useTheMusic();
  const track = state.current;

  return (
    <ABottomSheet
      isOpen={isOpen}
      label={say('common.quality')}
      title={say('common.quality')}
      onClose={onClose}
      isTall
    >
      <ScrollView contentContainerStyle={styles.whole}>
        {AUDIO_QUALITIES.map((quality) => {
          const choice = describeAudioQuality(quality, track);

          return (
            <ASheetChoice
              key={quality}
              label={choice.label}
              detail={choice.detail}
              isChosen={quality === state.quality}
              onPress={() => {
                player.setQuality(quality);
                onClose();
              }}
            />
          );
        })}
        {track === null ? null : (
          <View style={styles.file}>
            <Words size="small" tone="muted">
              {whatTheFileHolds(track)}
            </Words>
          </View>
        )}

        <View style={styles.heading}>
          <Words size="heading">{say('client.music.levellingChoices.volumeLevelling')}</Words>
        </View>
        {levellingChoices().map((choice) => (
          <ASheetChoice
            key={choice.id}
            label={choice.label}
            detail={choice.detail}
            isChosen={choice.id === state.levelling}
            onPress={() => {
              player.setLevelling(choice.id);
            }}
          />
        ))}

        <View style={styles.heading}>
          <Words size="heading">{say('client.music.crossfadeChoices.crossfade')}</Words>
        </View>
        {crossfadeChoices().map((choice) => (
          <ASheetChoice
            key={choice.seconds}
            label={choice.label}
            detail={choice.detail}
            isChosen={choice.seconds === state.crossfadeSeconds}
            onPress={() => {
              player.setCrossfade(choice.seconds);
            }}
          />
        ))}
      </ScrollView>
    </ABottomSheet>
  );
};

AQualitySheet.displayName = 'AQualitySheet';

export { AQualitySheet };
