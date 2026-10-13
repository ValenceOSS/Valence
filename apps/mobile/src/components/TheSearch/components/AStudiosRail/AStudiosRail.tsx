import { StyleSheet, Text, View } from 'react-native';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Button } from '@ValenceMobile/components/Button/Button';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import type { AStudiosRailProps } from './AStudiosRail.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  logo: { height: 46, width: 110 },
  name: { color: '#1d1d1f', fontFamily: FONTS.sans.bold, fontSize: 14, textAlign: 'center' },
  tile: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    height: 84,
    justifyContent: 'center',
    padding: 12,
    width: 150,
  },
});

/**
 * The studios and networks Discover knows, each a white tile with its mark, opening what is popular
 * from it — as the web's Discover lays them out between its shelves.
 *
 * @param studios - The studios.
 * @param onOpen - Told which studio to open.
 */
const AStudiosRail = ({ studios, onOpen }: AStudiosRailProps) => (
  <AShelf title={say('screens.requestsPage.studiosRail.studios')}>
    {studios.map((studio) => (
      <Button
        key={studio.id}
        tone="bare"
        label={studio.name}
        onPress={() => {
          onOpen(studio);
        }}
      >
        <View style={styles.tile}>
          {studio.logoUrl === null ? (
            <Text style={styles.name} numberOfLines={2}>
              {studio.name}
            </Text>
          ) : (
            <ARemotePicture
              style={styles.logo}
              fit="contain"
              uri={onThisServer(studio.logoUrl)}
              label={studio.name}
            />
          )}
        </View>
      </Button>
    ))}
  </AShelf>
);

AStudiosRail.displayName = 'AStudiosRail';

export { AStudiosRail };
