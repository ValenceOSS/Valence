import { StyleSheet, View } from 'react-native';
import { Shuffle } from '@keyline-icons/react-native';
import { AVATAR_STYLES, PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { AVATAR_STYLE_NAMES } from '@ValenceClient/profiles/AVATAR_STYLE_NAMES';
import { AColourSwatches } from '@ValenceMobile/components/AColourSwatches/AColourSwatches';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ADrawnStudioProps } from './ADrawnStudio.types';
import { say } from '@ValenceI18n/say';

const TILE = 64;

const styles = StyleSheet.create({
  section: { gap: 10 },
  style: { alignItems: 'center', gap: 6, width: TILE + 8 },
  styles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { borderRadius: 16, borderWidth: 2, height: TILE, overflow: 'hidden', width: TILE },
});

/**
 * The avatar studio: the profile's face drawn in each avatar style, a way to draw another face in
 * the chosen style, and the colour behind it.
 *
 * @param style - The chosen style.
 * @param seed - What the face is drawn from.
 * @param colour - The chosen colour.
 * @param onChange - Told the chosen style and seed.
 * @param onColour - Told which colour was chosen.
 */
const ADrawnStudio = ({ style, seed, colour, onChange, onColour }: ADrawnStudioProps) => {
  const colours = useTheColours();

  return (
    <View style={styles.section}>
      <Words size="small" tone="muted">
        {say('screens.faceEditor.drawnStudio.style')}
      </Words>
      <View style={styles.styles}>
        {AVATAR_STYLES.map((one) => (
          <Button
            key={one}
            tone="bare"
            label={say('screens.faceEditor.drawnStudio.drawItInTheSTYLENAMES', {
              STYLE_NAMES: AVATAR_STYLE_NAMES[one],
            })}
            isChosen={one === style}
            onPress={() => {
              onChange({ style: one, seed });
            }}
          >
            <View style={styles.style}>
              <View
                style={[
                  styles.tile,
                  {
                    backgroundColor: colour,
                    borderColor: one === style ? colours.accent : 'transparent',
                  },
                ]}
              >
                <APicture
                  picture={{
                    uri: onThisServer(
                      `/api/profiles/avatars/${one}?seed=${encodeURIComponent(seed)}`,
                    ),
                    isDrawn: true,
                  }}
                  onMissing={() => undefined}
                />
              </View>
              <Words size="small" tone={one === style ? 'plain' : 'muted'} lines={1}>
                {AVATAR_STYLE_NAMES[one]}
              </Words>
            </View>
          </Button>
        ))}
      </View>

      <Button
        tone="ghost"
        icon={Shuffle}
        onPress={() => {
          onChange({ style, seed: Math.random().toString(36).slice(2, 12) });
        }}
      >
        {say('screens.faceEditor.drawnStudio.anotherFace')}
      </Button>

      <Words size="small" tone="muted">
        {say('common.colour')}
      </Words>
      <AColourSwatches value={colour} options={PROFILE_COLOURS} onChoose={onColour} />
    </View>
  );
};

ADrawnStudio.displayName = 'ADrawnStudio';

export { ADrawnStudio };
