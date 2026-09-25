import { Check } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { say } from '@ValenceI18n/say';
import type { AReaderPanelProps } from './AReaderPanel.types';

const INDENT = 16;

const styles = StyleSheet.create({
  place: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 10 },
  placeName: { flex: 1 },
  places: { gap: 2 },
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
    <ASheet isOpen={isOpen} title={title} onClose={onClose}>
      {children}

      {places.length > 1 ? (
        <View style={styles.places}>
          <Words size="heading">{placesAre}</Words>
          {places.map((place) => (
            <Button
              key={place.id}
              tone="bare"
              label={say('phone.aReaderPanel.goTo', { place: place.label })}
              isChosen={place.isHere}
              onPress={() => {
                onPlace(place.id);
              }}
            >
              <View style={[styles.place, { paddingLeft: place.depth * INDENT }]}>
                <View style={styles.placeName}>
                  <Words lines={2} {...(place.isHere ? { isStrong: true } : {})}>
                    {place.label}
                  </Words>
                </View>
                {place.isHere ? <Icon of={Check} size={18} colour={colours.text} /> : null}
              </View>
            </Button>
          ))}
        </View>
      ) : null}
    </ASheet>
  );
};

AReaderPanel.displayName = 'AReaderPanel';

export { AReaderPanel };
