import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { canOpenPerson } from '@ValenceContracts/schemas/Person';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CastRowProps } from './CastRow.types';
import { say } from '@ValenceI18n/say';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';
import { rowsRememberTheirPlace } from '@ValenceTv/focus/rowsRememberTheirPlace';

const PORTRAIT = 132;

const AT_MOST = 16;

/**
 * Who is in a film or a programme, as a row of faces beneath its page, each with the part they
 * played, opening their own page. Only somebody the catalogue knows enough about to open is shown,
 * since a face that opens an empty page is worse than no face. Nothing is drawn where nobody can be
 * opened. The row catches the remote across the whole width of the page.
 *
 * @param cast - Who is in it, in billing order.
 * @param onOpen - Told whose page to open.
 */
const CastRow = ({ cast, onOpen }: CastRowProps) => {
  const shown = cast.filter((member) => canOpenPerson(member.personId)).slice(0, AT_MOST);

  if (shown.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{say('common.cast')}</Text>

      <FocusGuide isRemembering={rowsRememberTheirPlace}>
        <FlatList
          horizontal
          data={shown}
          keyExtractor={(member) => `${String(member.personId)}:${member.role}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inside}
          style={styles.row}
          renderItem={({ item }) => (
            <Focusable
              label={`${item.name}, ${item.role}`}
              onPress={() => {
                if (canOpenPerson(item.personId)) {
                  onOpen(item.personId);
                }
              }}
            >
              {(isFocused) => (
                <View style={styles.member}>
                  <View style={[styles.portrait, isFocused && styles.focused]}>
                    {item.imageUrl === null ? null : (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.picture}
                        contentFit="cover"
                      />
                    )}
                  </View>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.role} numberOfLines={1}>
                    {item.role}
                  </Text>
                </View>
              )}
            </Focusable>
          )}
        />
      </FocusGuide>
    </View>
  );
};

CastRow.displayName = 'CastRow';

const styles = StyleSheet.create({
  section: { gap: tokens.space.xs },
  heading: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingHorizontal: tokens.space.edge,
  },
  row: { overflow: 'visible' },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingVertical: tokens.space.md,
    gap: tokens.space.md,
  },
  member: { width: PORTRAIT + tokens.space.md, alignItems: 'center', gap: tokens.space.xs },
  portrait: {
    width: PORTRAIT,
    height: PORTRAIT,
    borderRadius: PORTRAIT / 2,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  focused: { borderColor: tokens.colours.text },
  picture: { width: '100%', height: '100%' },
  name: { color: tokens.colours.text, fontSize: tokens.type.small, fontWeight: '600' },
  role: { color: tokens.colours.muted, fontSize: tokens.type.small },
});

export { CastRow };
