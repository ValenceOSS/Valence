import { Image, StyleSheet, View } from 'react-native';
import { canOpenPerson } from '@ValenceContracts/schemas/Person';
import { AShelf } from '@ValencePhone/components/AShelf/AShelf';
import { Button } from '@ValencePhone/components/Button/Button';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheCastProps } from './TheCast.types';

const FACE = 76;

const styles = StyleSheet.create({
  face: { borderRadius: FACE / 2, height: FACE, overflow: 'hidden', width: FACE },
  photo: { height: '100%', width: '100%' },
  whole: { alignItems: 'center', gap: 4, width: FACE + 12 },
});

/**
 * Who is in it, a face each, opening the page about anybody the catalogue knows.
 *
 * @param cast - Who is in it, and as whom.
 * @param onLookAtPerson - Told whose page to open.
 */
const TheCast = ({ cast, onLookAtPerson }: TheCastProps) => {
  const colours = useTheColours();

  if (cast.length === 0) {
    return null;
  }

  return (
    <AShelf title="Cast">
      {cast.map((member) => {
        const face = (
          <View style={styles.whole}>
            <View style={[styles.face, { backgroundColor: colours.surfaceRaised }]}>
              {member.imageUrl === null ? null : (
                <Image
                  style={styles.photo}
                  source={{ uri: member.imageUrl }}
                  accessibilityIgnoresInvertColors
                />
              )}
            </View>
            <Words size="small" lines={2}>
              {member.name}
            </Words>
            <Words size="small" tone="muted" lines={2}>
              {member.role}
            </Words>
          </View>
        );
        const { personId } = member;

        return canOpenPerson(personId) ? (
          <Button
            key={`${member.name}:${member.role}`}
            tone="bare"
            label={member.name}
            onPress={() => {
              onLookAtPerson(personId);
            }}
          >
            {face}
          </Button>
        ) : (
          <View key={`${member.name}:${member.role}`}>{face}</View>
        );
      })}
    </AShelf>
  );
};

TheCast.displayName = 'TheCast';

export { TheCast };
