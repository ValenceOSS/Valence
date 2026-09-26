import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PixelRatio, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookPageUrl } from '@ValenceClient/books/fetchBooks';
import { readBookmarks } from '@ValenceClient/books/readBookmarks';
import { writeBookmarks } from '@ValenceClient/books/writeBookmarks';
import {
  readReaderPreferences,
  writeReaderPreferences,
} from '@ValenceClient/books/readerPreferences';
import { APageCurl } from '@ValenceMobile/components/APageCurl/APageCurl';
import { ASystemSlider } from '@ValenceMobile/components/ASystemSlider/ASystemSlider';
import { AReaderChrome } from '@ValenceMobile/components/AReader/components/AReaderChrome/AReaderChrome';
import { AReaderRail } from '@ValenceMobile/components/AReader/components/AReaderRail/AReaderRail';
import { AReaderSide } from '@ValenceMobile/components/AReader/components/AReaderSide/AReaderSide';
import { AReaderSheet } from '@ValenceMobile/components/AReader/components/AReaderSheet/AReaderSheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheSideStrip } from '@ValenceMobile/hooks/useTheSideStrip';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { turnThisPhoneSideways } from '@ValenceMobile/platform/turnThisPhoneSideways';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ReaderPreferences } from '@ValenceClient/books/readerPreferences';
import type { ARailTuning } from '@ValenceMobile/components/AReader/components/AReaderRail/ARailTuning';
import type { APageReaderProps } from './APageReader.types';

const PAPER = '#000000';

const INK = '#ffffff';

const THUMB_PIXELS = 160;

const SEAM = 5;

const PANEL_ROUND = 12;

const OPENED_FROM = 600;

const NEAR_THE_END = 4;

const NEXT_FIT = { both: 'width', height: 'both', width: 'height' } as const;

const SIDE_TOP = 24;

const CONTROLS_PANEL = '#2c2c30';

const RAIL_TUNINGS: Record<'folded' | 'opened', ARailTuning> = {
  folded: { buttonsX: -5, scrubberX: 31, scrubberWidth: 70, top: 166, isOutlined: false },
  opened: { buttonsX: -6, scrubberX: 30, scrubberWidth: 70, top: 118, isOutlined: false },
};

const styles = StyleSheet.create({
  end: { alignItems: 'center', gap: 16, justifyContent: 'center', padding: SCREEN_EDGE },
  foot: { gap: 8 },
  page: { bottom: 0, overflow: 'hidden', position: 'absolute', top: 0 },
  stripPanel: { bottom: 0, position: 'absolute', top: 0 },
  whole: { flex: 1 },
});

/**
 * A book of fixed pages — a comic, a manga, a PDF — turned as a printed book is: each page curls
 * over from wherever the finger took hold of it, by the system's own page curl, and a tap on the
 * left or right third turns it the same way. Held upright it shows a page at a time, and on its
 * side two, bound down the middle as an open book is. A tap in the middle shows or hides the bars,
 * and a page can be pinched to look closer.
 *
 * The bars over the page on an ordinary phone are dark frosted glass the page shows through, and
 * the panels beside it on a folding one the same dark graphite, whatever the page's colour, so the
 * page reads as a sheet held between them.
 *
 * On a folding phone with a strip down the side of its screen, the controls live in that strip
 * instead of over the page — the way back, the contents, and every page of the chapter as a column
 * of small pictures to drag through — on a dark panel of their own, set off from the page by a
 * black seam, so the page has the rest of the screen to itself. Opened out to two
 * pages, the spread is kept centred on the fold, with a panel on its far side matching the strip,
 * so the pages meet where the phone bends and the page sits between two matching edges. That panel
 * holds what the other hand reaches for: a turn onwards, a bookmark kept on this device, a lock
 * that holds the pages still, how the pages fill their leaves, and how far through the chapter is,
 * with the next chapter's first page once it is near.
 *
 * Two pages at once on an ordinary phone turns it on its side, as a film does; a folding phone is
 * never turned, since opening it out is what gives it room for two. Every turn is
 * remembered, so the book opens there next time, and the last page of the last chapter marks it
 * read. Turning past the last page of a chapter opens the next.
 *
 * @param book - The book.
 * @param chapters - Its chapters.
 * @param chapterId - The chapter open.
 * @param startAtPage - The page it opens at.
 * @param onChapter - Told to open another chapter.
 * @param onPage - Told which page is showing, and whether it is the last of the book.
 * @param onBack - Told somebody is done reading.
 */
const APageReader = ({
  book,
  chapters,
  chapterId,
  startAtPage,
  onChapter,
  onPage,
  onBack,
}: APageReaderProps) => {
  const { width, height } = useWindowDimensions();
  const room = useSafeAreaInsets();
  const strip = useTheSideStrip();
  const ordered = [...chapters].sort((one, other) => one.number - other.number);
  const at = ordered.findIndex((chapter) => chapter.id === chapterId);
  const chapter = ordered[at];
  const next = ordered[at + 1];
  const count = chapter?.pageCount ?? 0;
  const [page, setPage] = useState(Math.min(Math.max(startAtPage, 0), Math.max(count - 1, 0)));
  const [isShowingChrome, setIsShowingChrome] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [scrubbing, setScrubbing] = useState<number | null>(null);
  const [paper, setPaper] = useState(PAPER);
  const [isLocked, setIsLocked] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => readBookmarks(book.id, chapterId));
  const posture = Math.min(width, height) < OPENED_FROM ? 'folded' : 'opened';
  const tuning = RAIL_TUNINGS[posture];
  const [preferences, setPreferences] = useState(() =>
    readReaderPreferences(book.direction, book.id),
  );
  const isTwoUp = width > height;
  const leftRoom = strip?.side === 'left' ? strip.breadth + SEAM : room.left;
  const rightRoom = strip?.side === 'right' ? strip.breadth + SEAM : room.right;
  const onTheFold = strip !== null && isTwoUp ? strip.breadth + SEAM : 0;
  const bookWidth = width - leftRoom - rightRoom - onTheFold;
  const pagePixels = Math.round((bookWidth / (isTwoUp ? 2 : 1)) * PixelRatio.get());
  const isOnTheLast = page + (isTwoUp ? 2 : 1) >= count;
  const pages = Array.from({ length: count }, (_, one) =>
    onThisServer(bookPageUrl(book.id, chapterId, one, pagePixels)),
  );
  const pictures = Array.from({ length: count }, (_, one) =>
    onThisServer(bookPageUrl(book.id, chapterId, one, THUMB_PIXELS)),
  );

  useEffect(() => {
    if (count > 0) {
      onPage(page, next === undefined && isOnTheLast);
    }
  }, [page, count, next, onPage, isOnTheLast]);

  const hasStrip = strip !== null;

  useEffect(
    () => (preferences.isDouble && !hasStrip ? turnThisPhoneSideways() : undefined),
    [preferences.isDouble, hasStrip],
  );

  /**
   * Opens the next chapter, where there is one.
   */
  const readOn = () => {
    if (next !== undefined) {
      onChapter(next.id);
    }
  };

  /**
   * Keeps a new choice of how the pages are laid out.
   *
   * @param change - What changed.
   */
  const choose = (change: Partial<ReaderPreferences>) => {
    const chosen = { ...preferences, ...change };

    writeReaderPreferences(chosen, book.id);
    setPreferences(chosen);
  };

  const spread = isTwoUp ? [page, page + 1] : [page];
  const isMarked = spread.some((one) => bookmarks.includes(one));

  /**
   * Marks the pages showing, or unmarks them where either already is.
   */
  const mark = () => {
    const marked = isMarked
      ? bookmarks.filter((one) => !spread.includes(one))
      : [...bookmarks, page];

    writeBookmarks(book.id, chapterId, marked);
    setBookmarks(marked);
  };

  if (chapter === undefined || count === 0) {
    return (
      <View style={[styles.whole, styles.end, { backgroundColor: PAPER }]}>
        <Words colour={INK}>This chapter has no pages to show.</Words>
        <Button tone="bright" onPress={onBack}>
          Back
        </Button>
      </View>
    );
  }

  const theBook = (
    <APageCurl
      pages={pages}
      page={page}
      isTwoUp={isTwoUp}
      isCoverAlone={preferences.isOffset}
      isRightToLeft={preferences.direction === 'rightToLeft'}
      paper={PAPER}
      fit={preferences.fit}
      isLocked={isLocked}
      onTurn={setPage}
      onMiddle={() => {
        setIsShowingChrome((was) => !was);
      }}
      onPastTheEnd={readOn}
      onPaper={setPaper}
      style={
        strip === null
          ? [styles.whole, { marginLeft: leftRoom, marginRight: rightRoom }]
          : styles.whole
      }
    />
  );

  const panel = (
    <AReaderSheet
      isOpen={isPanelOpen}
      onClose={() => {
        setIsPanelOpen(false);
      }}
      title={book.title}
      isRightToLeft={preferences.direction === 'rightToLeft'}
      onRightToLeft={(isRightToLeft) => {
        choose({ direction: isRightToLeft ? 'rightToLeft' : 'leftToRight' });
      }}
      layout={hasStrip ? null : preferences.isDouble ? 'two' : 'one'}
      onLayout={(layout) => {
        choose({ isDouble: layout === 'two' });
      }}
      isCoverAlone={preferences.isOffset}
      onCoverAlone={(isOffset) => {
        choose({ isOffset });
      }}
      chapters={ordered.map((one) => ({
        id: one.id,
        label: one.title,
        isHere: one.id === chapterId,
      }))}
      onChapter={(id) => {
        setIsPanelOpen(false);

        if (id !== chapterId) {
          onChapter(id);
        }
      }}
    />
  );

  if (strip !== null) {
    return (
      <View style={[styles.whole, { backgroundColor: '#000000' }]}>
        <StatusBar style="light" />
        <View
          style={[
            styles.page,
            {
              backgroundColor: paper,
              left: leftRoom + (strip.side === 'right' ? onTheFold : 0),
              right: rightRoom + (strip.side === 'left' ? onTheFold : 0),
            },
            strip.side === 'right' || onTheFold > 0
              ? { borderBottomRightRadius: PANEL_ROUND, borderTopRightRadius: PANEL_ROUND }
              : null,
            strip.side === 'left' || onTheFold > 0
              ? { borderBottomLeftRadius: PANEL_ROUND, borderTopLeftRadius: PANEL_ROUND }
              : null,
          ]}
        >
          {theBook}
        </View>
        <View
          style={[
            styles.stripPanel,
            { backgroundColor: CONTROLS_PANEL, width: strip.breadth },
            strip.side === 'right'
              ? {
                  borderBottomLeftRadius: PANEL_ROUND,
                  borderTopLeftRadius: PANEL_ROUND,
                  right: 0,
                }
              : {
                  borderBottomRightRadius: PANEL_ROUND,
                  borderTopRightRadius: PANEL_ROUND,
                  left: 0,
                },
          ]}
        />
        {onTheFold > 0 ? (
          <View
            style={[
              styles.stripPanel,
              { backgroundColor: CONTROLS_PANEL, width: strip.breadth },
              strip.side === 'right'
                ? {
                    borderBottomRightRadius: PANEL_ROUND,
                    borderTopRightRadius: PANEL_ROUND,
                    left: 0,
                  }
                : {
                    borderBottomLeftRadius: PANEL_ROUND,
                    borderTopLeftRadius: PANEL_ROUND,
                    right: 0,
                  },
            ]}
          />
        ) : null}
        {onTheFold > 0 ? (
          <AReaderSide
            breadth={strip.breadth}
            side={strip.side === 'right' ? 'left' : 'right'}
            top={SIDE_TOP}
            below={room.bottom}
            ink={INK}
            isRightToLeft={preferences.direction === 'rightToLeft'}
            isMarked={isMarked}
            isLocked={isLocked}
            fit={preferences.fit}
            place={ordered.length > 1 ? chapter.title : book.title}
            through={(page + spread.length) / count}
            next={
              next !== undefined && page >= count - NEAR_THE_END
                ? {
                    title: next.title,
                    cover: onThisServer(bookPageUrl(book.id, next.id, 0, THUMB_PIXELS)),
                  }
                : null
            }
            onForward={() => {
              if (isOnTheLast) {
                readOn();

                return;
              }

              setPage(Math.min(page + spread.length, count - 1));
            }}
            onMark={mark}
            onLock={() => {
              setIsLocked((was) => !was);
            }}
            onFit={() => {
              choose({ fit: NEXT_FIT[preferences.fit] });
            }}
            onReadOn={readOn}
          />
        ) : null}
        <AReaderRail
          breadth={strip.breadth}
          freeFrom={strip.freeFrom}
          below={room.bottom}
          side={strip.side}
          centreIn={strip.centreIn}
          tuning={tuning}
          pictures={pictures}
          page={page}
          ink={INK}
          onPage={setPage}
          onBack={onBack}
          onPanel={() => {
            setIsPanelOpen(true);
          }}
          onReadOn={isOnTheLast && next !== undefined ? readOn : null}
        />
        {panel}
      </View>
    );
  }

  return (
    <AReaderChrome
      title={book.title}
      place={ordered.length > 1 ? chapter.title : null}
      paper={CONTROLS_PANEL}
      ink={INK}
      isDarkPage
      isFrosted
      isShown={isShowingChrome}
      onBack={onBack}
      onPanel={() => {
        setIsPanelOpen(true);
      }}
      footer={
        <View style={styles.foot}>
          {count > 1 ? (
            <ASystemSlider
              label="Go to a page"
              value={page}
              furthest={count - 1}
              tint={INK}
              onScrubbing={setScrubbing}
              onScrubbed={(to) => {
                setScrubbing(null);
                setPage(to);
              }}
            />
          ) : null}
          <Words size="small" isCentred colour={withAlpha(INK, 0.8)}>
            {`Page ${((scrubbing ?? page) + 1).toString()} of ${count.toString()}`}
          </Words>
          {isOnTheLast && next !== undefined ? (
            <Button tone="bright" onPress={readOn}>
              {`Read on: ${next.title}`}
            </Button>
          ) : null}
        </View>
      }
    >
      {theBook}
      {panel}
    </AReaderChrome>
  );
};

APageReader.displayName = 'APageReader';

export { APageReader };
