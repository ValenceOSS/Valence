import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { describeBirthLine } from '@ValenceClient/people/describeBirthLine';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { Button } from '@ValenceTv/components/Button/Button';
import { Shelf } from '@ValenceTv/components/Shelf/Shelf';
import { useProgress } from '@ValenceTv/library/useProgress';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PersonPageProps } from './PersonPage.types';
import { say } from '@ValenceI18n/say';

const PORTRAIT = 240;

const A_FEW_LINES = 6;

/**
 * Somebody who appears in the library, opened from a film's or a programme's cast: who they are,
 * when and where they were born, what the catalogue says of them, and a shelf each of the films,
 * programmes and episodes here they are in, each opening its page. Where either could not be read
 * it says so and offers to try again, rather than drawing somebody nameless with nothing to their
 * name.
 *
 * @param personId - Who.
 * @param onOpen - Told which film or programme was chosen.
 */
const PersonPage = ({ personId, onOpen }: PersonPageProps) => {
  const { progress } = useProgress();
  const person = useQuery(libraryQueries.person(personId));
  const credits = useQuery(libraryQueries.credits(personId));
  const who = person.data ?? null;

  if (person.isPending) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
      </View>
    );
  }

  if ((person.isError && who === null) || (credits.isError && credits.data === undefined)) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.born}>{say('common.anythingAboutThemCouldNotBeRead')}</Text>
        <Button
          label={say('common.tryAgain')}
          variant="secondary"
          hasPreferredFocus
          onPress={() => {
            void person.refetch();
            void credits.refetch();
          }}
        />
      </View>
    );
  }

  const born = who === null ? null : describeBirthLine(who);
  const shelves = [
    { title: say('common.films'), items: credits.data?.films ?? [] },
    { title: say('common.programmes'), items: credits.data?.shows ?? [] },
    { title: say('common.episodes'), items: credits.data?.episodes ?? [] },
  ].filter((shelf) => shelf.items.length > 0);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.inside}>
      <View style={styles.top}>
        <View style={styles.portrait}>
          {who?.portraitUrl === null || who === null ? null : (
            <Image source={{ uri: who.portraitUrl }} style={styles.picture} contentFit="cover" />
          )}
        </View>

        <View style={styles.words}>
          <Text style={styles.name}>{who?.name ?? say('common.somebody')}</Text>
          {born === null ? null : <Text style={styles.born}>{born}</Text>}
          {who?.biography === null || who === null ? null : (
            <Text style={styles.biography} numberOfLines={A_FEW_LINES}>
              {who.biography}
            </Text>
          )}
        </View>
      </View>

      {shelves.map((shelf, at) => (
        <Shelf
          key={shelf.title}
          title={shelf.title}
          items={shelf.items}
          progress={progress}
          isUrgent={at === 0}
          onOpen={onOpen}
        />
      ))}
    </ScrollView>
  );
};

PersonPage.displayName = 'PersonPage';

const styles = StyleSheet.create({
  page: { flex: 1 },
  inside: { gap: tokens.space.md, paddingTop: tokens.space.xl, paddingBottom: tokens.space.xl },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.space.lg },
  top: {
    flexDirection: 'row',
    gap: tokens.space.lg,
    paddingHorizontal: tokens.space.edge,
    alignItems: 'flex-start',
  },
  portrait: {
    width: PORTRAIT,
    height: PORTRAIT,
    borderRadius: PORTRAIT / 2,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  picture: { width: '100%', height: '100%' },
  words: { flex: 1, gap: tokens.space.sm, maxWidth: 1200 },
  name: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  born: { color: tokens.colours.muted, fontSize: tokens.type.body },
  biography: { color: tokens.colours.muted, fontSize: tokens.type.body, lineHeight: 40 },
});

export { PersonPage };
