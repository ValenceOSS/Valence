import { User } from '@keyline-icons/react-native';
import { Image, StyleSheet, View } from 'react-native';
import { canOpenPerson } from '@ValenceContracts/schemas/Person';
import { AShelf } from '@ValencePhone/components/AShelf/AShelf';
import { POSTER_WIDTH } from '@ValencePhone/components/APoster/POSTER_WIDTH';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheCastProps } from './TheCast.types';

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
    aspectRatio: 2 / 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    overflow: 'hidden',
    width: POSTER_WIDTH,
  },
  photo: { height: '100%', width: '100%' },
  said: { alignItems: 'center', gap: 2 },
  whole: { gap: 10, width: POSTER_WIDTH },
});

/**
 * Who is in it, as the web's row draws them: a portrait each, taller than it is wide, with the
 * performer's name and the part under it, opening the page about anybody the catalogue knows. A
 * performer nobody has a photograph of keeps their place with a figure in it.
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
            <View
              style={[
                styles.face,
                { backgroundColor: colours.surfaceRaised, borderColor: colours.border },
              ]}
            >
              {member.imageUrl === null ? (
                <Icon of={User} size={36} colour={colours.textMuted} />
              ) : (
                <Image
                  style={styles.photo}
                  source={{ uri: member.imageUrl }}
                  accessibilityIgnoresInvertColors
                />
              )}
            </View>
            <View style={styles.said}>
              <Words size="small" lines={2} isCentred>
                {member.name}
              </Words>
              <Words size="small" tone="muted" lines={2} isCentred>
                {member.role}
              </Words>
            </View>
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
