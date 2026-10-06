import { Check } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { describeAudioQuality } from '@ValenceClient/music/describeAudioQuality';
import { whatTheFileHolds } from '@ValenceClient/music/whatTheFileHolds';
import { AUDIO_QUALITIES } from '@ValenceContracts/schemas/Music';
import { ABottomSheet } from '@ValenceMobile/components/ABottomSheet/ABottomSheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AQualitySheetProps } from './AQualitySheet.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  file: { paddingHorizontal: 4, paddingTop: 12 },
  row: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  said: { flex: 1, gap: 2 },
  whole: { gap: 4 },
});

/**
 * How good the music sounds, chosen as the web's quality menu chooses it: the song's own file, or
 * one of the smaller ones made from it, each saying how many kilobits a second it takes and about
 * how much an hour of it costs, with what the song's own file holds beneath.
 *
 * @param isOpen - Whether it is out.
 * @param onClose - Told to put it away.
 */
const AQualitySheet = ({ isOpen, onClose }: AQualitySheetProps) => {
  const colours = useTheColours();
  const { player, state } = useTheMusic();
  const track = state.current;

  return (
    <ABottomSheet
      isOpen={isOpen}
      label={say('common.quality')}
      title={say('common.quality')}
      onClose={onClose}
    >
      <View style={styles.whole}>
        {AUDIO_QUALITIES.map((quality) => {
          const choice = describeAudioQuality(quality, track);
          const isChosen = quality === state.quality;

          return (
            <Button
              key={quality}
              tone="bare"
              label={choice.label}
              isChosen={isChosen}
              onPress={() => {
                player.setQuality(quality);
                onClose();
              }}
            >
              <View
                style={[
                  styles.row,
                  isChosen ? { backgroundColor: withAlpha(colours.text, 0.08) } : null,
                ]}
              >
                <View style={styles.said}>
                  <Words isStrong={isChosen}>{choice.label}</Words>
                  <Words size="small" tone="muted">
                    {choice.detail}
                  </Words>
                </View>
                {isChosen ? <Icon of={Check} size={18} colour={colours.text} /> : null}
              </View>
            </Button>
          );
        })}
        {track === null ? null : (
          <View style={styles.file}>
            <Words size="small" tone="muted">
              {whatTheFileHolds(track)}
            </Words>
          </View>
        )}
      </View>
    </ABottomSheet>
  );
};

AQualitySheet.displayName = 'AQualitySheet';

export { AQualitySheet };
