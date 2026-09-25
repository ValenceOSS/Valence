import { useState } from 'react';
import { BookOpen, Share } from '@keyline-icons/react-native';
import {
  BookOpen as BookOpenFilled,
  Headphones as HeadphonesFilled,
} from '@keyline-icons/react-native/fill';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import { chaptersOf } from '@ValenceClient/books/createAudiobookPlayer';
import { describeLength } from '@ValenceClient/books/describeLength';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { listenLabel } from '@ValenceClient/books/listenLabel';
import { startAtChapter } from '@ValenceClient/books/startAtChapter';
import { startListening } from '@ValenceClient/books/startListening';
import { stillListening } from '@ValenceClient/books/stillListening';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { useChapterPlaying } from '@ValenceClient/books/useChapterPlaying';
import { thePhonesAudiobookPlayer } from '@ValencePhone/books/thePhonesAudiobookPlayer';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { AShareSheet } from '@ValencePhone/components/AShareSheet/AShareSheet';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { TheStars } from '@ValencePhone/components/TheStars/TheStars';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheBook } from '@ValencePhone/hooks/useTheBook';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { ShareSubject } from '@ValenceClient/sharing/newShareFor.types';
import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';
import type { ReadingProgress } from '@ValenceContracts/schemas/Book';
import { AChapterToHear } from './components/AChapterToHear/AChapterToHear';
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
 * A book there is to hear has a way to listen to it too, carrying on from where this profile left
 * off, and saying where that was; it leads where the book has nothing to read. Its chapters are
 * listed as an album's songs are, with how long each lasts and the one playing marked, and any can
 * be listened to from its start.
 *
 * @param bookId - Which book.
 * @param onRead - Told to open it, at a chapter somebody picked or where they left off.
 * @param onListen - Told once the book has started playing, to show the player.
 * @param onBack - Told somebody is done with it.
 */
const ABook = ({ bookId, onRead, onListen, onBack }: ABookProps) => {
  const colours = useTheColours();
  const read = useQuery(bookQueries.one(bookId));
  const progress = useQuery(bookQueries.progress(bookId));
  const reading = useQuery(bookQueries.reading());
  const hasAudio = read.data?.book.hasAudio === true;
  const heard = useQuery({ ...bookQueries.listeningPlace(bookId), enabled: hasAudio });
  const listening = useQuery({ ...bookQueries.listening(), enabled: hasAudio });
  const [sharing, setSharing] = useState<ShareSubject | null>(null);
  const hearing = useTheBook();
  const chapterPlaying = useChapterPlaying(thePhonesAudiobookPlayer());

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

  const detail = read.data;
  const { book, chapters } = detail;
  const held = new Map((progress.data ?? []).map((one) => [one.chapterId, one]));
  const where = (reading.data ?? []).find((one) => one.book.id === bookId) ?? null;
  const isStarted = where !== null && !where.isFinished;
  const isFinished = where?.isFinished === true;
  const ordered = chapters
    .filter((chapter) => !isAudiobookFormat(chapter.format))
    .sort((one, other) => one.number - other.number);
  const partway = stillListening(listening.data ?? []).find((one) => one.book.id === bookId);
  const tracks = tracksOf(chapters);
  const toHear = chaptersOf(tracks);
  const isThisBook = hearing.state.book?.id === bookId;
  const listen = (
    <Button
      tone={ordered.length === 0 ? 'bold' : 'quiet'}
      icon={HeadphonesFilled}
      isWide
      onPress={() => {
        void startListening(detail, thePhonesAudiobookPlayer()).then(onListen);
      }}
    >
      {listenLabel(heard.data)}
    </Button>
  );
  const facts = [
    book.authors === null || book.authors.length === 0 ? null : book.authors.join(', '),
    book.year === null ? null : book.year.toString(),
    ordered.length > 1 ? `${ordered.length.toString()} chapters` : null,
    tracks.length === 0
      ? null
      : describeLength(tracks.reduce((all, track) => all + track.durationSeconds, 0)),
    ordered.length === 0 && toHear.length > 1 ? `${toHear.length.toString()} chapters` : null,
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

      {hasAudio && ordered.length === 0 ? listen : null}

      {ordered.length === 0 && !hasAudio ? (
        <Words tone="muted">
          Nothing in this book yet. Scanning the library again may find it.
        </Words>
      ) : ordered.length === 0 ? null : (
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

      {hasAudio && ordered.length > 0 ? listen : null}

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

      {partway === undefined ? null : (
        <Words tone="muted" isCentred>
          {partway.detail}
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
      {toHear.length > 1 ? (
        <View style={styles.chapters}>
          <Words size="heading">{ordered.length > 1 ? 'Audiobook chapters' : 'Chapters'}</Words>
          {toHear.map((chapter, at) => (
            <AChapterToHear
              key={`${at.toString()}:${chapter.title}`}
              title={chapter.title}
              at={at}
              lasts={chapter.bookEndSeconds - chapter.bookStartSeconds}
              isCurrent={isThisBook && at === chapterPlaying}
              onListen={(from) => {
                startAtChapter(thePhonesAudiobookPlayer(), book, tracks, from);
                onListen();
              }}
            />
          ))}
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
