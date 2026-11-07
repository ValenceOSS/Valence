import { Check } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { readableTitle } from '@ValenceCore/books/readableTitle';
import type { AReaderPanelProps } from './AReaderPanel.types';
import { say } from '@ValenceI18n/say';

const INDENT = 16;

const PANEL_SHARE = 0.62;

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden' },
  place: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingRight: 14,
    paddingVertical: 12,
  },
  placeName: { flex: 1 },
  places: { gap: 10 },
  seam: { height: StyleSheet.hairlineWidth, marginLeft: 14 },
});

/**
 * Everything a reader can be told, as the web's reader panel holds it, in a sheet over the page:
 * the way to any other place in the book — its chapters, or the contents of one — with the place
 * open ticked, and then the settings for how the book is shown.
 *
 * @param isOpen - Whether it is out.
 * @param title - What is being read.
 * @param placesAre - What the places are called — chapters, or contents.
 * @param places - The places, in order.
 * @param onPlace - Told to go to a place.
 * @param onClose - Told to put it away.
 * @param children - The settings.
 */
const AReaderPanel = ({
  isOpen,
  title,
  placesAre,
  places,
  onPlace,
  onClose,
  children,
}: AReaderPanelProps) => {
  const colours = useTheColours();

  return (
    <ASheet isOpen={isOpen} title={title} onClose={onClose} tallest={PANEL_SHARE} isTitled={false}>
      {children}

      {places.length > 1 ? (
        <View style={styles.places}>
          <Words size="small" tone="muted" isStrong>
            {placesAre}
          </Words>
          <View style={[styles.card, { backgroundColor: withAlpha(colours.text, 0.06) }]}>
            {places.map((place, at) => (
              <View key={place.id}>
                {at === 0 ? null : (
                  <View style={[styles.seam, { backgroundColor: withAlpha(colours.text, 0.1) }]} />
                )}
                <Button
                  tone="bare"
                  label={say('phone.aReader.aReaderPanel.goToLabel', { label: place.label })}
                  isChosen={place.isHere}
                  onPress={() => {
                    onPlace(place.id);
                  }}
                >
                  <View
                    style={[
                      styles.place,
                      {
                        backgroundColor: place.isHere ? withAlpha(colours.text, 0.08) : undefined,
                        paddingLeft: 14 + place.depth * INDENT,
                      },
                    ]}
                  >
                    <View style={styles.placeName}>
                      <Words
                        lines={2}
                        {...(place.isHere ? { isStrong: true } : { tone: 'muted' as const })}
                      >
                        {readableTitle(place.label)}
                      </Words>
                    </View>
                    {place.isHere ? <Icon of={Check} size={18} colour={colours.text} /> : null}
                  </View>
                </Button>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ASheet>
  );
};

AReaderPanel.displayName = 'AReaderPanel';

export { AReaderPanel };
