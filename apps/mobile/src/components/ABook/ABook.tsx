import { useState } from 'react';
import { BookOpen, Share } from '@keyline-icons/react-native';
import { BookOpen as BookOpenFilled } from '@keyline-icons/react-native/fill';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { AShareSheet } from '@ValenceMobile/components/AShareSheet/AShareSheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { TheStars } from '@ValenceMobile/components/TheStars/TheStars';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ShareSubject } from '@ValenceClient/sharing/newShareFor.types';
import type { ReadingProgress } from '@ValenceContracts/schemas/Book';
import type { ABookProps } from './ABook.types';

const COVER = 128;

const styles = StyleSheet.create({
  chapter: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 10 },
  chapters: { gap: 2 },
  cover: {
    alignItems: 'center',
    borderRadius: 8,
    height: COVER * 1.5,
    justifyContent: 'center',
    overflow: 'hidden',
    width: COVER,
  },
  fills: { height: '100%', width: '100%' },
  head: { flexDirection: 'row', gap: 16 },
  said: { flex: 1, gap: 4, justifyContent: 'flex-end' },
  title: { flex: 1, gap: 2 },
});

/**
 * How far somebody has read into one chapter, said shortly.
 *
 * @param read - What was recorded of it, if anything.
 * @param pageCount - How many pages it has, where it has pages.
 * @returns What to say, or nothing where it has not been opened.
 */
const howFarInto = (read: ReadingProgress | undefined, pageCount: number | null): string | null => {
  if (read === undefined) {
    return null;
  }

  if (read.isFinished) {
    return 'Read';
  }

  if (read.fraction !== null) {
    return `${Math.round(read.fraction * 100).toString()}% read`;
  }

  const page = (read.pageNumber ?? 0) + 1;

  return pageCount === null
    ? `Page ${page.toString()}`
    : `Page ${page.toString()} of ${pageCount.toString()}`;
};

/**
 * One book, as the web's book dialog shows it: its cover, who wrote it and when, how far this
 * profile has read, its stars, what it is about, and a way in — carrying on from where they stopped,
 * starting where nobody has, or starting again from the first page once it is finished. A book
 * of several chapters, as a series of comics is, lists them in order, each with its number, how
 * many pages it runs to and how far into it somebody has read, and any can be opened from its
 * start.
 *
 * @param bookId - Which book.
 * @param onRead - Told to open it, at a chapter somebody picked or where they left off.
 * @param onBack - Told somebody is done with it.
 */
const ABook = ({ bookId, onRead, onBack }: ABookProps) => {
  const colours = useTheColours();
  const read = useQuery(bookQueries.one(bookId));
  const progress = useQuery(bookQueries.progress(bookId));
  const reading = useQuery(bookQueries.reading());
  const [sharing, setSharing] = useState<ShareSubject | null>(null);

  if (read.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  if (read.data === undefined || read.data === null) {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="danger">That book could not be read.</Words>
      </Screen>
    );
  }

  const { book, chapters } = read.data;
  const held = new Map((progress.data ?? []).map((one) => [one.chapterId, one]));
  const where = (reading.data ?? []).find((one) => one.book.id === bookId) ?? null;
  const isStarted = where !== null && !where.isFinished;
  const isFinished = where?.isFinished === true;
  const ordered = [...chapters].sort((one, other) => one.number - other.number);
  const facts = [
    book.authors === null || book.authors.length === 0 ? null : book.authors.join(', '),
    book.year === null ? null : book.year.toString(),
    ordered.length > 1 ? `${ordered.length.toString()} chapters` : null,
  ].filter((fact) => fact !== null);

  return (
    <Screen scrolls onBack={onBack}>
      <View style={styles.head}>
        <View style={[styles.cover, { backgroundColor: colours.surfaceRaised }]}>
          {book.hasCover ? (
            <Image
              style={styles.fills}
              source={{ uri: onThisServer(bookCoverUrl(book.id)) }}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Icon of={BookOpen} size={40} colour={colours.textMuted} />
          )}
        </View>
        <View style={styles.said}>
          <Words size="heading">{book.title}</Words>
          {facts.length === 0 ? null : <Words tone="muted">{facts.join(' · ')}</Words>}
        </View>
      </View>

      {ordered.length === 0 ? (
        <Words tone="muted">
          Nothing in this book yet. Scanning the library again may find it.
        </Words>
      ) : (
        <Button
          tone="bold"
          icon={BookOpenFilled}
          isWide
          onPress={() => {
            onRead(book.id, null, isFinished);
          }}
        >
          {isStarted ? 'Continue reading' : isFinished ? 'Read again' : 'Read'}
        </Button>
      )}

      <Button
        tone="ghost"
        icon={Share}
        isWide
        onPress={() => {
          setSharing({ kind: 'book', book });
        }}
      >
        Share
      </Button>

      {where === null ? null : (
        <Words tone="muted" isCentred>
          {isFinished ? 'Finished' : describeReadingPlace(where)}
        </Words>
      )}

      <TheStars subject={{ bookId: book.id }} />

      {book.overview === null ? null : <Words isProse>{book.overview}</Words>}

      {ordered.length > 1 ? (
        <View style={styles.chapters}>
          <Words size="heading">Chapters</Words>
          {ordered.map((chapter) => {
            const note = [
              chapter.pageCount === null
                ? null
                : `${chapter.pageCount.toString()} ${chapter.pageCount === 1 ? 'page' : 'pages'}`,
              howFarInto(held.get(chapter.id), chapter.pageCount),
            ]
              .filter((part) => part !== null)
              .join(' · ');

            return (
              <Button
                key={chapter.id}
                tone="bare"
                label={`Read ${chapter.title}`}
                onPress={() => {
                  onRead(book.id, chapter.id, false);
                }}
              >
                <View style={styles.chapter}>
                  <View style={styles.title}>
                    <Words lines={1}>{`${chapter.number.toString()}. ${chapter.title}`}</Words>
                    {note === '' ? null : (
                      <Words size="small" tone="muted">
                        {note}
                      </Words>
                    )}
                  </View>
                </View>
              </Button>
            );
          })}
        </View>
      ) : null}
      <AShareSheet
        subject={sharing}
        onClose={() => {
          setSharing(null);
        }}
      />
    </Screen>
  );
};

ABook.displayName = 'ABook';

export { ABook };
