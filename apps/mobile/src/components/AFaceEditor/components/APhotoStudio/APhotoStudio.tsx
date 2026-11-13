import { useDeferredValue } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image as ImageIcon, ImagePlus, RotateCcw } from '@keyline-icons/react-native';
import {
  UIImagePickerPreferredAssetRepresentationMode,
  launchImageLibraryAsync,
} from 'expo-image-picker';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Slider } from '@ValenceMobile/components/Slider/Slider';
import { APhotoFilters } from '@ValenceMobile/components/AFaceEditor/components/APhotoFilters/APhotoFilters';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { isUnframed } from '@ValenceCore/pictures/isUnframed';
import type { APhotoStudioProps } from './APhotoStudio.types';
import { say } from '@ValenceI18n/say';
import { MOST_FRAME_ZOOM } from '@ValenceContracts/constants/MOST_FRAME_ZOOM';

const UNFRAMED = { zoom: 1, x: 0, y: 0 };

const GREYED = 0.4;

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  section: { gap: 14 },
  slider: { flex: 1 },
  zoom: { alignItems: 'center', flexDirection: 'row', gap: 12 },
});

/**
 * The photo studio, as the web's: how near the picture is drawn, a way to choose another from the
 * phone's library and to put it back where it started, and the filters it can be drawn in. Until
 * there is a picture, what works on one is greyed and still.
 *
 * @param frame - How the picture sits.
 * @param uri - Where the picture is, once there is one, which the filters are shown on.
 * @param filter - The filter it is drawn in.
 * @param onPick - Told the picture chosen, and whether it is a video.
 * @param onFrame - Told how the picture now sits.
 * @param onFilter - Told a filter was chosen.
 */
const APhotoStudio = ({ frame, uri, filter, onPick, onFrame, onFilter }: APhotoStudioProps) => {
  const colours = useTheColours();
  const hasPicture = uri !== null;
  const settled = useDeferredValue(frame);

  const choose = async () => {
    const chosen = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    const asset = chosen.assets?.[0];

    if (chosen.canceled || asset === undefined) {
      return;
    }

    onPick({ uri: asset.uri, isVideo: false });
    onFrame(UNFRAMED);
    onFilter('original');
  };

  return (
    <View style={styles.section}>
      <View
        style={[styles.zoom, { opacity: hasPicture ? 1 : GREYED }]}
        pointerEvents={hasPicture ? 'auto' : 'none'}
      >
        <Icon of={ImageIcon} size={14} colour={colours.textMuted} />
        <View style={styles.slider}>
          <Slider
            label={say('common.zoom')}
            value={frame.zoom - 1}
            furthest={MOST_FRAME_ZOOM - 1}
            colour={colours.text}
            restColour={withAlpha(colours.text, 0.15)}
            aheadColour={withAlpha(colours.text, 0.15)}
            onScrubbing={(to) => {
              onFrame({ ...frame, zoom: 1 + to });
            }}
            onScrubbed={(to) => {
              onFrame({ ...frame, zoom: 1 + to });
            }}
          />
        </View>
        <Icon of={ImageIcon} size={20} colour={colours.textMuted} />
      </View>

      <View style={styles.buttons}>
        <View style={styles.half}>
          <Button
            tone="ghost"
            icon={ImagePlus}
            isWide
            onPress={() => {
              void choose();
            }}
          >
            {hasPicture ? say('common.chooseAnother') : say('common.chooseAPicture')}
          </Button>
        </View>
        <View style={styles.half}>
          <Button
            tone="ghost"
            icon={RotateCcw}
            isWide
            isDisabled={!hasPicture || isUnframed(frame)}
            onPress={() => {
              onFrame(UNFRAMED);
            }}
          >
            {say('common.resetPosition')}
          </Button>
        </View>
      </View>

      <View style={{ opacity: hasPicture ? 1 : GREYED }}>
        <APhotoFilters uri={uri} frame={settled} chosen={filter} onChoose={onFilter} />
      </View>
    </View>
  );
};

APhotoStudio.displayName = 'APhotoStudio';

export { APhotoStudio };
