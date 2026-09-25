import { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw } from '@keyline-icons/react-native';
import { Headphones } from '@keyline-icons/react-native/fill';
import { chaptersOf } from '@ValenceClient/books/createAudiobookPlayer';
import { describeLength } from '@ValenceClient/books/describeLength';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { listenLabel } from '@ValenceClient/books/listenLabel';
import { startAtChapter } from '@ValenceClient/books/startAtChapter';
import { startListening } from '@ValenceClient/books/startListening';
import { stillListening } from '@ValenceClient/books/stillListening';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { useAudiobookPlayer } from '@ValenceClient/books/useAudiobookPlayer';
import { useChapterPlaying } from '@ValenceClient/books/useChapterPlaying';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Button } from '@ValenceTv/components/Button/Button';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { NumberedRow } from '@ValenceTv/components/NumberedRow/NumberedRow';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { tokens } from '@ValenceTv/theme/tokens';
import type { BookPageProps } from './BookPage.types';

const COVER = { width: 240, height: 360 };

/**
 * An audiobook's own page, laid out as an album's is: its cover, and beside it what it is called,
 * who wrote it, how long it lasts, what it is about and where this profile has got to, with a way to
 * listen — carrying on from where they left off, or starting again — and beneath them every
 * chapter, with bars beside the one playing. Choosing a chapter starts the book there, and either
 * way the player opens over the page.
 *
 * @param bookId - The book.
 * @param onListen - Told once the book has started, to show the player.
 */
const BookPage = ({ bookId, onListen }: BookPageProps) => {
  const detail = useQuery(bookQueries.one(bookId));
  const place = useQuery(bookQueries.listeningPlace(bookId));
  const listening = useQuery(bookQueries.listening());
  const player = theAudiobookPlayer();
  const { state } = useAudiobookPlayer(player, { followsPosition: false });
  const playingAt = useChapterPlaying(player);
  const room = useRoomToFill();
  const found = detail.data ?? null;
  const tracks = useMemo(() => (found === null ? [] : tracksOf(found.chapters)), [found]);
  const chapters = useMemo(() => chaptersOf(tracks), [tracks]);
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
  const isPartway = place.data !== null && place.data !== undefined && !place.data.isFinished;
  const isThisBook = state.book?.id === bookId;

  const header = (
    <View style={styles.header}>
      <View style={[styles.lifted, COVER]}>
        <View style={styles.cover}>
          {book.hasCover ? (
            <Artwork path={bookCoverUrl(book.id)} isUrgent style={StyleSheet.absoluteFill} />
          ) : (
            <Text numberOfLines={4} style={styles.titled}>
              {book.title}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.about}>
        <Text style={styles.kind}>Audiobook</Text>
        <Text numberOfLines={2} style={styles.title}>
          {book.title}
        </Text>
        {book.authors === null || book.authors.length === 0 ? null : (
          <Text numberOfLines={1} style={styles.by}>
            {book.authors.join(', ')}
          </Text>
        )}
        <Text style={styles.facts}>
          {joinFacts([
            book.year?.toString(),
            describeLength(length),
            chapters.length === 1 ? '1 chapter' : `${chapters.length.toString()} chapters`,
            partway?.detail,
          ])}
        </Text>
        {book.overview === null || book.overview === '' ? null : (
          <Text numberOfLines={3} style={styles.overview}>
            {book.overview}
          </Text>
        )}

        <View style={styles.actions}>
          <Button
            label={listenLabel(place.data)}
            icon={Headphones}
            variant="primary"
            hasPreferredFocus
            onPress={() => {
              void startListening(found, player).then(onListen);
            }}
          />
          {isPartway ? (
            <Button
              label="Start again"
              icon={RotateCcw}
              variant="secondary"
              onPress={() => {
                player.open(book, tracks, null);
                onListen();
              }}
            />
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <FadeIn>
      <View style={styles.page} onLayout={room.onLayout}>
        {room.height === null ? null : (
          <FlatList
            style={{ height: room.height }}
            data={chapters}
            keyExtractor={(chapter, at) => `${at.toString()}:${chapter.title}`}
            contentContainerStyle={styles.inside}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={header}
            renderItem={({ item, index }) => (
              <View style={styles.chapter}>
                <NumberedRow
                  label={`${item.title}, ${describeLength(item.bookEndSeconds - item.bookStartSeconds)}`}
                  title={item.title}
                  length={item.bookEndSeconds - item.bookStartSeconds}
                  place={index}
                  isCurrent={isThisBook && index === playingAt}
                  isPlaying={state.isPlaying}
                  onPress={(at) => {
                    startAtChapter(player, book, tracks, at);
                    onListen();
                  }}
                />
              </View>
            )}
          />
        )}
      </View>
    </FadeIn>
  );
};

BookPage.displayName = 'BookPage';

const styles = StyleSheet.create({
  page: { flex: 1 },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  problem: { color: tokens.colours.muted, fontSize: tokens.type.body },
  inside: { paddingTop: tokens.space.xl, paddingBottom: tokens.space.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tokens.space.xl,
    paddingHorizontal: tokens.space.edge,
    paddingBottom: tokens.space.lg,
  },
  lifted: {
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
  },
  cover: {
    flex: 1,
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
    justifyContent: 'flex-end',
    padding: tokens.space.sm,
  },
  titled: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '800' },
  about: { flex: 1, gap: tokens.space.xs },
  kind: {
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: { color: tokens.colours.text, fontSize: tokens.type.hero, fontWeight: '800' },
  by: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
  facts: { color: tokens.colours.muted, fontSize: tokens.type.small },
  overview: {
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    lineHeight: 32,
    maxWidth: 1100,
  },
  actions: { flexDirection: 'row', gap: tokens.space.md, marginTop: tokens.space.md },
  chapter: {
    paddingHorizontal: tokens.space.edge - tokens.space.md,
    paddingVertical: tokens.space.xs,
  },
});

export { BookPage };
