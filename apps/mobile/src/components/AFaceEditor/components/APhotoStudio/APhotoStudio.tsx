import { StyleSheet, View } from 'react-native';
import { ImagePlus, Maximize } from '@keyline-icons/react-native';
import {
  UIImagePickerPreferredAssetRepresentationMode,
  launchImageLibraryAsync,
} from 'expo-image-picker';
import { ASettingSlider } from '@ValenceMobile/components/AFaceEditor/components/ASettingSlider/ASettingSlider';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import type { APhotoStudioProps } from './APhotoStudio.types';
import { say } from '@ValenceI18n/say';

const UNFRAMED = { zoom: 1, x: 0, y: 0 };

const styles = StyleSheet.create({
  section: { gap: 12 },
});

/**
 * The photo studio: a photo or GIF from the phone's library, and how it sits in the circle, zoomed and moved across and up and down as the web frames it.
 *
 * @param frame - How the picture sits.
 * @param onPick - Told the picture chosen, and whether it is a video.
 * @param onFrame - Told how the picture now sits.
 */
const APhotoStudio = ({ frame, onPick, onFrame }: APhotoStudioProps) => {
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
  };

  return (
    <View style={styles.section}>
      <Words size="small" tone="muted">
        {say('phone.aFaceEditor.aPhotoOrAGIF')}
      </Words>
      <Button
        tone="quiet"
        icon={ImagePlus}
        onPress={() => {
          void choose();
        }}
      >
        {say('phone.aFaceEditor.chooseAPhotoOrGIF')}
      </Button>

      <Words size="small" tone="muted">
        {say('screens.faceEditor.photoStudio.framing')}
      </Words>
      <ASettingSlider
        label={say('common.zoom')}
        value={frame.zoom}
        min={1}
        max={4}
        onChange={(zoom) => {
          onFrame({ ...frame, zoom });
        }}
      />
      <ASettingSlider
        label={say('screens.faceEditor.photoStudio.across')}
        value={frame.x}
        min={-1}
        max={1}
        onChange={(x) => {
          onFrame({ ...frame, x });
        }}
      />
      <ASettingSlider
        label={say('screens.faceEditor.photoStudio.upAndDown')}
        value={frame.y}
        min={-1}
        max={1}
        onChange={(y) => {
          onFrame({ ...frame, y });
        }}
      />
      <Button
        tone="ghost"
        icon={Maximize}
        onPress={() => {
          onFrame(UNFRAMED);
        }}
      >
        {say('screens.faceEditor.photoStudio.fitTheWholePicture')}
      </Button>
    </View>
  );
};

APhotoStudio.displayName = 'APhotoStudio';

export { APhotoStudio };
