import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { describeBirthLine } from '@ValenceClient/people/describeBirthLine';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { Button } from '@ValenceTv/components/Button/Button';
import { Shelf } from '@ValenceTv/components/Shelf/Shelf';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { FocusFence } from '@ValenceTv/components/FocusFence/FocusFence';
import { BiographyReader } from '@ValenceTv/screens/PersonPage/components/BiographyReader/BiographyReader';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { giveFocusTo } from '@ValenceTv/navigation/giveFocusTo';
import { useProgress } from '@ValenceTv/library/useProgress';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { PersonPageProps } from './PersonPage.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const PORTRAIT = { width: 320, height: 480 };

const A_FEW_LINES = 6;

const A_LINE = 34;

/**
 * Somebody who appears in the library, opened from a film's or a programme's cast: their portrait
 * as a card, the shape the catalogue took it in, and beside it who they are, when and where they
 * were born, how much of theirs is here — so many films, programmes and episodes — and what the
 * catalogue says of them, which opens whole over the page where it runs past the lines it is given
 * — it is measured whole, unseen, to know — and closing it puts the remote back on Read more;
 * beneath, a shelf each of the films, programmes and episodes here they are in, each opening its
 * page. Where either could not be read it says so and offers to try again, rather than drawing
 * somebody nameless with nothing to their name. The page is lit by their portrait, and then by
 * whichever of theirs the remote rests on, as Films is lit by the poster it rests on.
 *
 * @param personId - Who.
 * @param onOpen - Told which film or programme was chosen.
 * @param onLight - Told the picture to light the page with.
 */
const PersonPage = ({ personId, onOpen, onLight }: PersonPageProps) => {
  const { progress } = useProgress();
  const person = useQuery(libraryQueries.person(personId));
  const credits = useQuery(libraryQueries.credits(personId));
  const who = person.data ?? null;
  const [restingOn, setRestingOn] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isCut, setIsCut] = useState(false);
  const readMore = useRef<View>(null);
  const wasReading = useRef(false);
  const stopReading = useCallback(() => {
    setIsReading(false);
  }, []);

  useEffect(() => {
    if (wasReading.current && !isReading) {
      giveFocusTo(readMore.current);
    }

    wasReading.current = isReading;
  }, [isReading]);
  const mood = restingOn ?? who?.portraitUrl ?? null;
  const light = useCallback((media: MediaSummary) => {
    setRestingOn(artworkUrl(media.id, 'backdrop', { isOfTitle: true, size: 'medium' }));
  }, []);

  useEffect(() => {
    onLight(mood);
  }, [mood, onLight]);

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

  const counts = [
    credits.data === undefined || credits.data.films.length === 0
      ? null
      : sayCount('common.count.films', credits.data.films.length),
    credits.data === undefined || credits.data.shows.length === 0
      ? null
      : sayCount('common.count.shows', credits.data.shows.length),
    credits.data === undefined || credits.data.episodes.length === 0
      ? null
      : sayCount('common.count.episodes', credits.data.episodes.length),
  ].filter((count) => count !== null);

  return (
    <View style={styles.page}>
      <FocusFence isShut={isReading} style={styles.page}>
        <ScrollView style={styles.page} contentContainerStyle={styles.inside}>
          <View style={styles.head}>
            <View style={[styles.portrait, PORTRAIT]}>
              <Artwork
                path={who?.portraitUrl ?? null}
                anchor="top"
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View style={styles.words}>
              <Text style={styles.name}>{who?.name ?? say('common.somebody')}</Text>
              {born === null && counts.length === 0 ? null : (
                <Text style={styles.born}>{joinFacts([born, ...counts])}</Text>
              )}
              {who?.biography === null || who === null ? null : (
                <>
                  <View>
                    <Text style={styles.biography} numberOfLines={A_FEW_LINES}>
                      {who.biography}
                    </Text>
                    <Text
                      style={[styles.biography, styles.measured]}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      onLayout={(event) => {
                        setIsCut(event.nativeEvent.layout.height > A_FEW_LINES * A_LINE + 1);
                      }}
                    >
                      {who.biography}
                    </Text>
                  </View>
                  {isCut ? (
                    <View style={styles.more}>
                      <Button
                        ref={readMore}
                        label={say('common.readMore')}
                        variant="secondary"
                        onPress={() => {
                          setIsReading(true);
                        }}
                      />
                    </View>
                  ) : null}
                </>
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
              onFocus={light}
            />
          ))}
        </ScrollView>
      </FocusFence>

      {isReading && who !== null && who.biography !== null ? (
        <BiographyReader name={who.name} biography={who.biography} onClose={stopReading} />
      ) : null}
    </View>
  );
};

PersonPage.displayName = 'PersonPage';

const styles = StyleSheet.create({
  page: { flex: 1 },
  inside: {
    gap: tokens.space.md,
    paddingTop: tokens.space.xl + tokens.space.lg,
    paddingBottom: tokens.space.xl,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tokens.space.xl,
    paddingHorizontal: tokens.space.edge,
    paddingBottom: tokens.space.md,
  },
  portrait: {
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  words: { flex: 1, gap: tokens.space.sm, maxWidth: 1100, paddingBottom: tokens.space.sm },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.space.lg },
  name: { color: tokens.colours.text, fontSize: tokens.type.hero, fontWeight: '800' },
  born: { color: tokens.colours.muted, fontSize: tokens.type.body },
  biography: { color: tokens.colours.text, fontSize: tokens.type.small, lineHeight: A_LINE },
  measured: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 },
  more: { alignItems: 'flex-start', marginTop: tokens.space.xs },
});

export { PersonPage };
