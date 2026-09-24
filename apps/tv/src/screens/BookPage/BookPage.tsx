import { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw } from '@keyline-icons/react-native';
import { Headphones } from '@keyline-icons/react-native/fill';
import { chaptersOf } from '@ValenceClient/books/createAudiobookPlayer';
import { describeLength } from '@ValenceClient/books/describeLength';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { listenLabel } from '@ValenceClient/books/listenLabel';
import { startListening } from '@ValenceClient/books/startListening';
import { stillListening } from '@ValenceClient/books/stillListening';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { tokens } from '@ValenceTv/theme/tokens';
import type { BookPageProps } from './BookPage.types';

const COLUMN = 900;

const COVER = { width: 400, height: 600 };

const CLEAR_OF_THE_CHIP = 150;

/**
 * An audiobook's own page: its title and who wrote it, how long it lasts and how many chapters it
 * has, what it is about, and its cover beside them — with a way to listen, or to carry on from where
 * this profile left off, or to start again. Listening opens the player over the page. The spread
 * sits low enough to clear what is playing in the corner.
 *
 * @param bookId - The book.
 * @param onListen - Told once the book has started, to show the player.
 */
const BookPage = ({ bookId, onListen }: BookPageProps) => {
  const detail = useQuery(bookQueries.one(bookId));
  const place = useQuery(bookQueries.listeningPlace(bookId));
  const listening = useQuery(bookQueries.listening());
  const found = detail.data ?? null;
  const tracks = useMemo(() => (found === null ? [] : tracksOf(found.chapters)), [found]);
  const partway = useMemo(
    () => stillListening(listening.data ?? []).find(({ book }) => book.id === bookId),
    [listening.data, bookId],
  );

  if (found === null || tracks.length === 0) {
    return (
      <View style={styles.waiting}>
        {detail.isPending ? (
          <ActivityIndicator size="large" color={tokens.colours.text} />
        ) : (
          <Text style={styles.problem}>This book has nothing to listen to.</Text>
        )}
      </View>
    );
  }

  const { book } = found;
  const length = tracks.reduce((all, track) => all + track.durationSeconds, 0);
  const chapters = chaptersOf(tracks).length;
  const isPartway = place.data !== null && place.data !== undefined && !place.data.isFinished;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.inside}>
      <FadeIn>
        <View style={styles.spread}>
          <View style={styles.column}>
            <Text numberOfLines={2} style={styles.title}>
              {book.title}
            </Text>

            {book.authors === null || book.authors.length === 0 ? null : (
              <Text numberOfLines={1} style={styles.authors}>
                {book.authors.join(', ')}
              </Text>
            )}

            <Text style={styles.facts}>
              {joinFacts([
                book.year?.toString(),
                describeLength(length),
                chapters === 1 ? '1 chapter' : `${chapters.toString()} chapters`,
              ])}
            </Text>

            {book.overview === null || book.overview === '' ? null : (
              <Text numberOfLines={6} style={styles.overview}>
                {book.overview}
              </Text>
            )}

            {partway === undefined ? null : <Text style={styles.where}>{partway.detail}</Text>}

            <TVFocusGuideView autoFocus style={styles.actions}>
              <ActionRow
                label={listenLabel(place.data)}
                icon={Headphones}
                hasPreferredFocus
                onPress={() => {
                  void startListening(found, theAudiobookPlayer()).then(onListen);
                }}
                {...(partway === undefined ? {} : { watchedFraction: partway.fraction })}
              />

              {isPartway ? (
                <ActionRow
                  label="Listen from the beginning"
                  icon={RotateCcw}
                  onPress={() => {
                    theAudiobookPlayer().open(book, tracks, null);
                    onListen();
                  }}
                />
              ) : null}
            </TVFocusGuideView>
          </View>

          <View style={[styles.lifted, COVER]}>
            <View style={styles.cover}>
              {book.hasCover ? (
                <Artwork path={bookCoverUrl(book.id)} isUrgent style={StyleSheet.absoluteFill} />
              ) : null}
            </View>
          </View>
        </View>
      </FadeIn>
    </ScrollView>
  );
};

BookPage.displayName = 'BookPage';

const styles = StyleSheet.create({
  page: { flex: 1 },
  inside: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: CLEAR_OF_THE_CHIP,
    paddingBottom: tokens.space.xl,
  },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  problem: { color: tokens.colours.muted, fontSize: tokens.type.body },
  spread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space.edge,
  },
  column: { width: COLUMN, gap: tokens.space.sm },
  title: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '800' },
  authors: { color: tokens.colours.text, fontSize: tokens.type.body },
  facts: { color: tokens.colours.muted, fontSize: tokens.type.small },
  overview: {
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    lineHeight: 34,
    maxWidth: tokens.ACTION_WIDTH + 160,
  },
  where: { color: tokens.colours.muted, fontSize: tokens.type.small },
  actions: { marginTop: tokens.space.md, gap: tokens.space.xs, alignItems: 'flex-start' },
  cover: {
    flex: 1,
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  lifted: {
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
  },
});

export { BookPage };
