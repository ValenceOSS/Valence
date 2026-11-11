import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Animated,
  Linking,
  PanResponder,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { AMatteCurl } from '@ValenceMobile/components/AMatteCurl/AMatteCurl';
import { drawsNatively } from '@ValenceMobile/platform/drawsNatively';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useBookText } from '@ValenceMobile/books/useBookText';
import { placeOfPage } from '@ValenceClient/books/placeOfPage';
import { nameOfPart } from '@ValenceCore/books/nameOfPart';
import { firstToShow } from '@ValenceClient/books/firstToShow';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { READING_THEMES } from '@ValenceCore/tokens/READING_THEMES';
import { readingThemeOf } from '@ValenceClient/books/readingThemeOf';
import { READING_SERIF } from '@ValenceMobile/theme/READING_SERIF';
import { AReadingLook } from '@ValenceMobile/components/AReader/components/ATextReader/components/AReadingLook/AReadingLook';
import { PAGE_TURN } from '@ValenceCore/tokens/PAGE_TURN';
import { isPageSwipe } from '@ValenceCore/functions/isPageSwipe';
import { turnOfPageSwipe } from '@ValenceCore/functions/turnOfPageSwipe';
import { bookPlaceIn } from '@ValenceContracts/schemas/Book';
import { TEXT_LOOK } from '@ValenceClient/books/TEXT_LOOK';
import { contentsEntryAt } from '@ValenceClient/books/contentsEntryAt';
import { fractionOfBook } from '@ValenceClient/books/fractionOfBook';
import { placeInBook } from '@ValenceClient/books/placeInBook';
import { readBookDocument } from '@ValenceCore/books/readBookDocument';
import { readBookmarks } from '@ValenceClient/books/readBookmarks';
import { writeBookmarks } from '@ValenceClient/books/writeBookmarks';
import {
  TEXT_MARGINS,
  TEXT_SIZES,
  TEXT_SPACINGS,
  readTextPreferences,
  writeTextPreferences,
} from '@ValenceClient/books/textPreferences';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { AReaderChrome } from '@ValenceMobile/components/AReader/components/AReaderChrome/AReaderChrome';
import { AReaderPanel } from '@ValenceMobile/components/AReader/components/AReaderPanel/AReaderPanel';
import { TheBookText } from '@ValenceMobile/components/AReader/components/ATextReader/components/TheBookText/TheBookText';
import { Button } from '@ValenceMobile/components/Button/Button';
import { ALabelledToggle } from '@ValenceMobile/components/ALabelledToggle/ALabelledToggle';
import { readableTitle } from '@ValenceCore/books/readableTitle';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Slider } from '@ValenceMobile/components/Slider/Slider';
import { Words } from '@ValenceMobile/components/Words/Words';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { readerBarLook } from '@ValenceMobile/components/AReader/readerBarLook';
import type { ComponentRef } from 'react';
import type { TextPreferences } from '@ValenceClient/books/textPreferences';
import type { ATextReaderProps } from './ATextReader.types';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const SLIDER_STEPS = 1000;

const MARK_STEPS = 1_000_000;

const MARKS_OF_TEXT = ':text';

const NO_PICTURES: readonly string[] = [];

const AHEAD = 4;

const QUIET_BEFORE_CAPTURE_MS = 450;

const BEHIND = 2;

const CLEAR_OF_THE_BARS = 64;

const QUIET = 0.45;

const TURNS = {
  duration: PAGE_TURN.curls.ms,
  easing: PAGE_TURN.curls.ease,
  useNativeDriver: true,
} as const;

/**
 * Leaves a link alone, for the copy of the page that lies beneath the one being turned, which is
 * only ever looked at.
 */
const ignoreLink = (): void => undefined;

/**
 * Leaves the named places alone, for the copy of the page that lies beneath the one being turned;
 * the page on top says where they are.
 */
const ignoreAnchors = (): void => undefined;

/**
 * Stays on the first page of the book, which has nothing before it.
 */
const stayPut = (): void => undefined;

/**
 * Waits for what was just changed to be drawn, two frames being what it takes for a scrolled page
 * to reach the screen.
 *
 * @returns When it has been.
 */
const drawn = (): Promise<void> =>
  new Promise((done) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        done();
      });
    });
  });

const NAMES: Readonly<Record<string, string>> = {
  small: say('common.small'),
  medium: say('common.medium'),
  large: say('common.large'),
  larger: say('common.larger'),
  tight: say('common.tight'),
  normal: say('common.normal'),
  loose: say('common.loose'),
  narrow: say('common.narrow'),
  wide: say('common.wide'),
  light: say('common.light'),
  sepia: say('common.sepia'),
  dark: say('common.dark'),
};

const styles = StyleSheet.create({
  band: { left: 0, position: 'absolute', right: 0 },
  foot: {
    borderRadius: 20,
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  marker: { justifyContent: 'center', left: 0, position: 'absolute', right: 0 },
  readings: { flexDirection: 'row', justifyContent: 'space-between' },
  setting: { gap: 10 },
  leaf: { shadowOffset: { height: 0, width: 4 }, shadowRadius: 12 },
  waiting: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  whole: { flex: 1 },
});

/**
 * The choices for one setting, named as the web names them.
 *
 * @param ids - The choices.
 * @returns Them, as a row offers them.
 */
const choicesOf = (ids: readonly string[]) => ids.map((id) => ({ id, label: NAMES[id] ?? id }));

/**
 * A book whose text reflows — an EPUB, or a PDF with words in it — read as Apple Books reads one.
 * On an iPhone the whole book is set as one run of pages, natively, each part of it starting on a
 * page of its own, its pictures drawn in place, a cover on a page to itself, and a part with nothing
 * in it taking no page; turning the corner of a page curls it over, and every page, the slider and
 * the page count run across the whole book, with the name of the part a page is in above it.
 * Scrolling instead reads the whole book as one long page. A link goes to the place it names.
 *
 * Elsewhere, or for somebody who has asked for less movement, one part of the book is shown at a
 * time, turned by tapping the left or right third of the page or by swiping across it, and moving on
 * from one part into the next as a page is turned.
 *
 * It is set in a serif, justified, in one of six themes chosen as Apple Books offers them, beside
 * the size, spacing and margins, kept on this device. The bars hold the way back, a bookmark, a
 * slider to anywhere in the book, and the reader's panel, which holds the book's contents — its own,
 * or its headings where it has none — and those settings.
 *
 * It opens at the fraction of the way through the book somebody had reached, and every turn is
 * remembered as that same fraction, weighted by how long each part is, so the web and the phone
 * carry on from each other. The last page marks the book read, and offers the next book of a series
 * where there is one.
 *
 * @param book - The book.
 * @param chapterId - Which of its files is open.
 * @param startAtFraction - How far through it to open.
 * @param next - The next book of the series, if there is one.
 * @param onChapter - Told to open another of its files.
 * @param onFraction - Told how far through it somebody is, and whether they have finished.
 * @param onBack - Told somebody is done reading.
 */
const ATextReader = ({
  book,
  chapterId,
  startAtFraction,
  next,
  onChapter,
  onFraction,
  onBack,
}: ATextReaderProps) => {
  const { width, height } = useWindowDimensions();
  const room = useSafeAreaInsets();
  const isStill = usePrefersStillness();
  const contents = useQuery(bookQueries.contents(book.id, chapterId));
  const sizes = useMemo(() => contents.data?.parts.map((part) => part.size) ?? [], [contents.data]);
  const [opened, setPart] = useState<number | null>(null);
  const [aim, setAim] = useState<{
    part: number;
    at: { within: number } | { anchor: string };
  } | null>(null);
  const [cookie, setCookie] = useState<string | null | undefined>(undefined);
  const [landing, setLanding] = useState<{ within: number } | { anchor: string } | null>(null);
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState(0);
  const [tall, setTall] = useState(0);
  const [anchors, setAnchors] = useState<ReadonlyMap<string, number>>(new Map());
  const [isShowingChrome, setIsShowingChrome] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [settings, setSettings] = useState(() => readTextPreferences());
  const [across] = useState(() => new Animated.Value(0));
  const turning = useRef(false);
  const pageArea = useRef<ComponentRef<typeof View>>(null);
  const [leaves, setLeaves] = useState<{
    key: string;
    part: number;
    pictures: readonly string[];
  }>({ key: '', part: -1, pictures: [] });
  const captured = useRef<{ key: string; pictures: string[] }>({ key: '', pictures: [] });
  const [drawing, setDrawing] = useState<number | null>(null);
  const capturing = useRef({ page: 0, step: 0, pages: 0 });
  const lastTouched = useRef(0);
  const long = useRef<ComponentRef<typeof ScrollView>>(null);
  const [longY, setLongY] = useState(0);
  const [longLaid, setLongLaid] = useState<ReadonlyMap<number, { top: number; height: number }>>(
    new Map(),
  );
  const longAnchors = useRef(new Map<string, number>());
  const [longTall, setLongTall] = useState(0);
  const [longShown, setLongShown] = useState(0);
  const [bookmarks, setBookmarks] = useState(() =>
    readBookmarks(book.id, `${chapterId}${MARKS_OF_TEXT}`),
  );
  const [laid, setLaid] = useState<{
    count: number;
    anchors: Readonly<Record<string, number>>;
    starts: readonly number[];
    isFinal: boolean;
  } | null>(null);
  const beneath = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrolling = useRef<ComponentRef<typeof ScrollView>>(null);
  const theme = readingThemeOf(settings);
  const colours = READING_THEMES[theme];
  const sizeAt = TEXT_SIZES.indexOf(settings.size);
  const face = useMemo(
    () => ({
      regular: colours.isBold ? READING_SERIF.bold : READING_SERIF.regular,
      bold: READING_SERIF.bold,
      isJustified: true,
    }),
    [colours.isBold],
  );
  const size = TEXT_LOOK.size[settings.size];
  const lineHeight = Math.round(size * TEXT_LOOK.leading[settings.spacing]);
  const margin = Math.max(width * TEXT_LOOK.margin[settings.margins], 16);
  const topRoom = room.top + CLEAR_OF_THE_BARS;
  const footRoom = room.bottom + CLEAR_OF_THE_BARS;
  const step = Math.max(Math.floor((shown - topRoom - footRoom) / lineHeight), 1) * lineHeight;
  const written = Math.max(tall - topRoom - shown, 1);
  const pages = Math.max(Math.ceil(written / step), 1);
  const isLong = settings.isScrolling;
  const isNative = drawsNatively() && !isStill && !isLong;
  const isWhole = isNative || isLong;
  const whole = useBookText(
    book.id,
    chapterId,
    opened,
    sizes.length > 0 ? sizes.length : null,
    contents.data?.contents ?? null,
    isLong,
    isWhole,
  );
  const isWholeRead = isWhole && whole.isWhole;
  const wholeNodes = useMemo(
    () => whole.parts.map((one) => (one?.html === undefined ? [] : readBookDocument(one.html))),
    [whole.parts],
  );
  const wholeBlocks = useMemo(() => whole.parts.map((one) => one?.blocks ?? []), [whole.parts]);
  const shownParts = useMemo(
    () => wholeBlocks.flatMap((blocks, at) => (blocks.length === 0 ? [] : [at])),
    [wholeBlocks],
  );
  const entries = useMemo(
    () =>
      isWholeRead && whole.contents !== null ? whole.contents : (contents.data?.contents ?? []),
    [isWholeRead, whole.contents, contents.data],
  );
  const isLongLaid =
    isLong && isWholeRead && shownParts.every((at) => longLaid.has(at)) && longShown > 0;

  /**
   * Which part a height down the whole book falls in, and how far through that part it is.
   *
   * @param y - How far down the book.
   * @returns The part and how far through it, from 0 to 1.
   */
  const longAt = (y: number) => {
    let found = shownParts[0] ?? 0;

    for (const at of shownParts) {
      const box = longLaid.get(at);

      if (box !== undefined && box.top <= y + 1) {
        found = at;
      }
    }

    const box = longLaid.get(found);

    return {
      part: found,
      within:
        box === undefined ? 0 : Math.min(Math.max((y - box.top) / Math.max(box.height, 1), 0), 1),
    };
  };

  const nativeHere = laid === null ? null : placeOfPage(laid.starts, laid.count, page);
  const startHere = isNative ? nativeHere : isLongLaid ? longAt(longY) : null;
  const endHere = isNative
    ? nativeHere === null
      ? null
      : { part: nativeHere.part, within: nativeHere.withinEnd }
    : isLongLaid
      ? longAt(longY + longShown)
      : null;
  const through = (page * step) / written;
  const throughEnd = ((page + 1) * step) / written;
  const part = isWhole ? (startHere?.part ?? aim?.part ?? null) : opened;

  if (opened === null && sizes.length > 0) {
    const opening = placeInBook(sizes, startAtFraction);

    setPart(opening.part);
    setLanding({ within: opening.within });
    setAim({ part: opening.part, at: { within: opening.within } });
  }

  useEffect(() => {
    void theCookiesThisPhoneHolds(onThisServer('/')).then(setCookie);
  }, []);

  const document = useQuery({
    ...bookQueries.document(book.id, chapterId, opened ?? 0),
    enabled: opened !== null && !isWhole,
  });
  const nodes = useMemo(
    () =>
      document.data === undefined || document.data === null ? [] : readBookDocument(document.data),
    [document.data],
  );
  const last = sizes.length - 1;
  const here = part === null ? null : contentsEntryAt(entries, part, 0, new Map());
  const fraction = isWhole
    ? startHere === null
      ? startAtFraction
      : fractionOfBook(sizes, startHere.part, startHere.within)
    : opened === null
      ? startAtFraction
      : fractionOfBook(sizes, opened, through);
  const isAtTheEnd = isNative
    ? laid !== null && page >= laid.count - 1
    : isLong
      ? isLongLaid && longY + longShown >= longTall - 2
      : opened === last && page >= pages - 1;
  const pageStarts = part === null ? 0 : Math.round(fraction * MARK_STEPS);
  const pageEnds = isWhole
    ? endHere === null
      ? 0
      : Math.round(fractionOfBook(sizes, endHere.part, endHere.within) * MARK_STEPS)
    : opened === null
      ? 0
      : Math.round(fractionOfBook(sizes, opened, throughEnd) * MARK_STEPS);
  const isMarked = bookmarks.some((at) => at >= pageStarts && at < pageEnds);
  const isLaidOut = isLong
    ? isLongLaid && aim === null
    : isNative
      ? laid !== null && aim === null
      : !document.isPending && landing === null && shown > 0 && tall > 0;
  const placeName =
    part === null
      ? book.title
      : isWhole
        ? nameOfPart(entries, wholeBlocks[part] ?? [], part, book.title)
        : readableTitle(here === null ? book.title : (entries[here]?.title ?? book.title));
  const pageOfPages = isLong
    ? placeName
    : isNative
      ? laid === null
        ? ''
        : laid.isFinal
          ? say('phone.aReader.aPageReader.pageValueOfCount', {
              value: (page + 1).toString(),
              count: laid.count.toString(),
            })
          : say('common.pageValue', { value: (page + 1).toString() })
      : isLaidOut
        ? say('phone.aReader.aPageReader.pageValueOfCount', {
            value: ((drawing ?? page) + 1).toString(),
            count: pages.toString(),
          })
        : '';

  useEffect(() => {
    if (landing === null || tall === 0 || shown === 0 || nodes.length === 0) {
      return;
    }

    const anchorAt = 'anchor' in landing ? anchors.get(landing.anchor) : undefined;

    if ('anchor' in landing && anchorAt === undefined) {
      return;
    }

    const to =
      anchorAt === undefined
        ? Math.min(Math.floor(('within' in landing ? landing.within : 0) * pages), pages - 1)
        : Math.min(Math.floor(anchorAt / step), pages - 1);

    scrolling.current?.scrollTo({ y: to * step, animated: false });
    setPage(to);
    setLanding(null);
  }, [landing, tall, shown, nodes.length, anchors, pages, step]);

  useEffect(() => {
    if (!isLong || aim === null || !isLongLaid) {
      return;
    }

    const at = shownParts.find((one) => one >= aim.part) ?? shownParts.at(-1) ?? 0;
    const box = longLaid.get(at);
    const anchored =
      'anchor' in aim.at
        ? longAnchors.current.get(`${aim.part.toString()}#${aim.at.anchor}`)
        : undefined;
    const y =
      box === undefined
        ? 0
        : box.top +
          (anchored ?? ('within' in aim.at && at === aim.part ? aim.at.within * box.height : 0));

    long.current?.scrollTo({ y, animated: false });
    setLongY(y);
    setAim(null);
  }, [isLong, aim, isLongLaid, shownParts, longLaid]);

  useEffect(() => {
    if (!isNative || aim === null || laid === null) {
      return;
    }

    const start = laid.starts[aim.part] ?? 0;
    const inPart = Math.max((laid.starts[aim.part + 1] ?? laid.count) - start, 1);
    const anchored =
      'anchor' in aim.at ? laid.anchors[`${aim.part.toString()}#${aim.at.anchor}`] : undefined;
    const to =
      anchored ??
      start + Math.min(Math.floor(('within' in aim.at ? aim.at.within : 0) * inPart), inPart - 1);

    setPage(Math.min(Math.max(to, 0), Math.max(laid.count - 1, 0)));
    setAim(null);
  }, [isNative, aim, laid]);

  useEffect(() => {
    if (part !== null && (isWhole ? isLaidOut : landing === null && tall > 0)) {
      onFraction(fraction, isAtTheEnd);
    }
  }, [part, isWhole, isLaidOut, landing, tall, fraction, isAtTheEnd, onFraction]);

  const leafKey = [
    chapterId,
    part ?? -1,
    settings.size,
    settings.spacing,
    settings.margins,
    theme,
    width,
    shown,
    pages,
  ].join(':');

  useLayoutEffect(() => {
    capturing.current = { page, step, pages };
  });

  useEffect(() => {
    if (isNative || isLong || !isLaidOut || part === null) {
      return undefined;
    }

    const run = { isLive: true };
    const isGone = () => !run.isLive;
    const { page: from, step: by, pages: count } = capturing.current;

    if (captured.current.key !== leafKey) {
      captured.current = { key: leafKey, pictures: Array.from({ length: count }, () => '') };
    }

    const kept = captured.current;
    const wanted = Array.from({ length: AHEAD + BEHIND + 1 }, (_, at) => from - BEHIND + at)
      .filter((at) => at >= 0 && at < count && (kept.pictures[at] ?? '') === '')
      .sort((one, other) => Math.abs(one - from) - Math.abs(other - from));

    if (wanted.length === 0) {
      return undefined;
    }

    void (async () => {
      for (const at of wanted) {
        while (
          Math.abs(at - capturing.current.page) > 1 &&
          Date.now() - lastTouched.current < QUIET_BEFORE_CAPTURE_MS
        ) {
          await new Promise((done) => {
            setTimeout(done, QUIET_BEFORE_CAPTURE_MS / 3);
          });

          if (isGone()) {
            return;
          }
        }

        setDrawing(at);
        scrolling.current?.scrollTo({ y: at * by, animated: false });
        await drawn();

        if (isGone()) {
          return;
        }

        kept.pictures[at] = await captureRef(pageArea, {
          format: 'jpg',
          quality: 0.9,
          result: 'tmpfile',
        })
          .then((address) => (address.startsWith('file:') ? address : `file://${address}`))
          .catch(() => '');

        if (isGone()) {
          return;
        }

        setLeaves({ key: leafKey, part, pictures: [...kept.pictures] });
      }

      setDrawing(null);
      scrolling.current?.scrollTo({ y: capturing.current.page * by, animated: false });
    })();

    return () => {
      run.isLive = false;
      setDrawing(null);
    };
  }, [isNative, isLong, isLaidOut, leafKey, page, part]);

  const curls = !isStill && leaves.part === part && (leaves.pictures[page] ?? '') !== '';
  const shownFrom = opened === null ? null : firstToShow(whole.parts, opened);
  const typeset = useMemo(() => {
    if (cookie === undefined || opened === null || (!isWholeRead && shownFrom === null)) {
      return null;
    }

    return JSON.stringify({
      parts: Array.from({ length: sizes.length }, (_, at) => {
        const blocks =
          isWholeRead || (shownFrom !== null && at >= opened && at <= shownFrom)
            ? (wholeBlocks[at] ?? [])
            : [];

        return {
          heading: nameOfPart(entries, wholeBlocks[at] ?? [], at, book.title),
          blocks: blocks.map((block) =>
            block.picture === undefined
              ? block
              : {
                  ...block,
                  picture: { ...block.picture, address: onThisServer(block.picture.address) },
                },
          ),
        };
      }),
      cookie,
      isWhole: isWholeRead,
    });
  }, [cookie, isWholeRead, shownFrom, sizes.length, entries, wholeBlocks, opened, book.title]);
  const column = Math.max(Math.floor((height - topRoom - footRoom) / lineHeight), 1) * lineHeight;
  const bookLook = {
    fontSize: size,
    lineHeight,
    insetX: Math.max(margin, room.left + 8),
    top: topRoom,
    foot: footRoom,
    headerCentre: room.top + CLEAR_OF_THE_BARS / 2,
    footerCentre: (topRoom + column + height - room.bottom) / 2,
    regular: colours.isBold ? READING_SERIF.bold : READING_SERIF.regular,
    bold: READING_SERIF.bold,
    italic: colours.isBold ? READING_SERIF.boldItalic : READING_SERIF.italic,
    boldItalic: READING_SERIF.boldItalic,
    chrome: FONTS.sans.medium,
    footer: say('phone.aReader.aPageReader.pageValueOfCount', {
      value: '{value}',
      count: '{count}',
    }),
    isJustified: true,
  };

  /**
   * Opens a section, landing as far down it as asked or at a named place in it.
   *
   * @param to - Which section.
   * @param at - How far down it, or the place.
   */
  const goTo = (to: number, at: { within: number } | { anchor: string }) => {
    if (isWhole) {
      setAim({ part: to, at });

      return;
    }

    if (to === part) {
      setLanding(at);

      return;
    }

    setTall(0);
    setAnchors(new Map());
    setPart(to);
    setLanding(at);
  };

  /**
   * Moves on or back a page, into the next or last section where this one runs out.
   *
   * @param by - One on, or one back.
   */
  const move = (by: 1 | -1) => {
    if (part === null) {
      return;
    }

    const to = page + by;

    if (to >= 0 && to < pages) {
      scrolling.current?.scrollTo({ y: to * step, animated: false });
      setPage(to);

      return;
    }

    if (by === 1 && part < last) {
      goTo(part + 1, { within: 0 });
    }

    if (by === -1 && part > 0) {
      goTo(part - 1, { within: 1 });
    }
  };

  /**
   * Turns a page as Apple Books does: going on, the page slides away to the left and uncovers the
   * next, which was lying beneath it all along; going back, the page before slides in over it from
   * the left. Into another section of the book, or for somebody who has asked for less movement,
   * the page simply changes.
   *
   * @param by - One on, or one back.
   */
  const turn = (by: 1 | -1) => {
    if (turning.current || (by === 1 && isAtTheEnd) || (by === -1 && part === 0 && page === 0)) {
      return;
    }

    const to = page + by;

    if (isStill || to < 0 || to >= pages) {
      move(by);

      return;
    }

    turning.current = true;

    if (by === 1) {
      beneath.current?.scrollTo({ y: to * step, animated: false });
      Animated.timing(across, { ...TURNS, toValue: -width }).start(() => {
        scrolling.current?.scrollTo({ y: to * step, animated: false });
        setPage(to);
        requestAnimationFrame(() => {
          across.setValue(0);
          turning.current = false;
        });
      });

      return;
    }

    beneath.current?.scrollTo({ y: page * step, animated: false });
    across.setValue(-width);
    scrolling.current?.scrollTo({ y: to * step, animated: false });
    setPage(to);
    Animated.timing(across, { ...TURNS, toValue: 0 }).start(() => {
      turning.current = false;
    });
  };

  const [latest] = useState(() => new Map<'turn', (by: 1 | -1) => void>());

  useLayoutEffect(() => {
    latest.set('turn', turn);
  });

  const [swiping] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) => isPageSwipe(gesture.dx, gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        const swiped = turnOfPageSwipe(gesture.dx, gesture.vx);

        if (swiped !== 0) {
          latest.get('turn')?.(swiped < 0 ? 1 : -1);
        }
      },
    }),
  );
  /**
   * Follows a link: to its place, where it names one in the book, or out to the phone.
   *
   * @param href - Where the link goes.
   */
  const follow = (href: string) => {
    const place = bookPlaceIn(href);

    if (place !== null) {
      goTo(place.part, place.anchor === null ? { within: 0 } : { anchor: place.anchor });

      return;
    }

    if (/^(https?|mailto):/i.test(href)) {
      void Linking.openURL(href);
    }
  };

  const [links] = useState(() => new Map<'follow', (href: string) => void>());

  useLayoutEffect(() => {
    links.set('follow', follow);
  });

  const followLink = useCallback(
    (href: string) => {
      links.get('follow')?.(href);
    },
    [links],
  );

  const pageRoom = {
    gap: lineHeight,
    paddingBottom: shown,
    paddingLeft: Math.max(margin, room.left + 8),
    paddingRight: Math.max(margin, room.right + 8),
    paddingTop: topRoom,
  };

  /**
   * Keeps a new choice of how the text is shown.
   *
   * @param change - What changed.
   */
  const choose = (change: Partial<TextPreferences>) => {
    const chosen = { ...settings, ...change };

    writeTextPreferences(chosen);
    setSettings(chosen);
    setLanding({ within: through });

    if (startHere !== null) {
      setAim({ part: startHere.part, at: { within: startHere.within } });
    }

    if (isNative || chosen.isScrolling !== settings.isScrolling) {
      setLaid(null);
    }
  };

  return (
    <AReaderChrome
      title={book.title}
      place={
        isWhole
          ? part === null
            ? null
            : placeName
          : here === null
            ? null
            : (entries[here]?.title ?? null)
      }
      paper={colours.paper}
      ink={colours.ink}
      isDarkPage={colours.isDark}
      mark={{
        isMarked,
        onMark: () => {
          const marked = isMarked
            ? bookmarks.filter((at) => at < pageStarts || at >= pageEnds)
            : [...bookmarks, pageStarts].sort((one, other) => one - other);

          writeBookmarks(book.id, `${chapterId}${MARKS_OF_TEXT}`, marked);
          setBookmarks(marked);
        },
      }}
      isShown={isShowingChrome}
      onBack={onBack}
      onPanel={() => {
        setIsPanelOpen(true);
      }}
      footer={
        <View style={[styles.foot, readerBarLook(colours.paper, colours.ink, colours.isDark)]}>
          <Slider
            label={say('phone.aReader.aTextReader.goToAPlaceInThe')}
            value={
              isNative && laid?.isFinal === true
                ? Math.round((page / Math.max(laid.count - 1, 1)) * SLIDER_STEPS)
                : Math.round(fraction * SLIDER_STEPS)
            }
            furthest={SLIDER_STEPS}
            colour={colours.ink}
            restColour={withAlpha(colours.ink, 0.18)}
            aheadColour={withAlpha(colours.ink, 0.18)}
            onScrubbed={(to) => {
              if (isNative && laid?.isFinal === true) {
                setPage(Math.round((to / SLIDER_STEPS) * Math.max(laid.count - 1, 0)));

                return;
              }

              const place = placeInBook(sizes, to / SLIDER_STEPS);

              goTo(place.part, { within: place.within });
            }}
          />
          <View style={styles.readings}>
            <Words size="small" isStrong colour={colours.ink}>
              {pageOfPages}
            </Words>
            <Words size="small" colour={withAlpha(colours.ink, 0.6)}>
              {say('common.percentRead', { percent: Math.round(fraction * 100).toString() })}
            </Words>
          </View>
        </View>
      }
    >
      {contents.isError || document.isError || whole.isFailed ? (
        <View style={[styles.whole, { padding: 24, paddingTop: topRoom }]}>
          <Words colour={colours.ink}>{say('common.thatBookCouldNotBeRead')}</Words>
        </View>
      ) : isLong ? (
        <ScrollView
          ref={long}
          style={[styles.whole, { backgroundColor: colours.paper }]}
          contentContainerStyle={{
            paddingBottom: footRoom + lineHeight * 2,
            paddingLeft: Math.max(margin, room.left + 8),
            paddingRight: Math.max(margin, room.right + 8),
            paddingTop: topRoom,
          }}
          scrollEventThrottle={100}
          onLayout={({ nativeEvent }) => {
            setLongShown(nativeEvent.layout.height);
          }}
          onContentSizeChange={(_, tallness) => {
            setLongTall(tallness);
          }}
          onScroll={({ nativeEvent }) => {
            setLongY(nativeEvent.contentOffset.y);
          }}
        >
          {!isWholeRead ? (
            <ASpinner colour={colours.ink} />
          ) : (
            shownParts.map((at) => (
              <View
                key={at}
                style={{ paddingBottom: lineHeight * 3 }}
                onLayout={({ nativeEvent }) => {
                  const { y, height: tallness } = nativeEvent.layout;

                  setLongLaid((was) => {
                    const known = was.get(at);

                    return known !== undefined && known.top === y && known.height === tallness
                      ? was
                      : new Map(was).set(at, { top: y, height: tallness });
                  });
                }}
              >
                <Button
                  tone="bare"
                  holdsStill
                  label={
                    isShowingChrome ? say('common.hideTheControls') : say('common.showTheControls')
                  }
                  onPress={() => {
                    setIsShowingChrome((was) => !was);
                  }}
                >
                  <TheBookText
                    nodes={wholeNodes[at] ?? []}
                    size={size}
                    leading={TEXT_LOOK.leading[settings.spacing]}
                    ink={colours.ink}
                    face={face}
                    onLink={followLink}
                    onAnchors={(found) => {
                      found.forEach((y, name) => {
                        longAnchors.current.set(`${at.toString()}#${name}`, y);
                      });
                    }}
                  />
                </Button>
              </View>
            ))
          )}
          {next !== null && isWholeRead ? (
            <Button
              tone="bold"
              onPress={() => {
                onChapter(next.id);
              }}
            >
              {say('phone.aReader.aTextReader.onToTitle', { title: next.title })}
            </Button>
          ) : null}
        </ScrollView>
      ) : isNative ? (
        <View style={[styles.whole, { backgroundColor: colours.paper }]}>
          {typeset === null ? (
            <ASpinner colour={colours.ink} />
          ) : (
            <AMatteCurl
              style={StyleSheet.absoluteFill}
              pages={NO_PICTURES}
              page={page}
              paper={colours.paper}
              ink={colours.ink}
              book={typeset}
              bookLook={bookLook}
              isLocked={isPanelOpen}
              isAnimated={settings.isAnimated}
              onPages={(count, anchors, starts, isFinal) => {
                if (laid !== null && aim === null) {
                  const here = placeOfPage(laid.starts, laid.count, page);

                  setAim({ part: here.part, at: { within: here.within } });
                }

                setLaid({ count, anchors, starts, isFinal });
              }}
              onGrab={() => {
                lastTouched.current = Date.now();
              }}
              onTurn={setPage}
              onMiddle={() => {
                setIsShowingChrome((was) => !was);
              }}
              onPastTheEnd={() => {
                if (next !== null && laid?.isFinal === true) {
                  onChapter(next.id);
                }
              }}
              onBeforeTheStart={stayPut}
            />
          )}
          {typeset !== null && laid === null ? (
            <View pointerEvents="none" style={[styles.waiting, { backgroundColor: colours.paper }]}>
              <ASpinner colour={colours.ink} />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.whole}>
          <View
            ref={pageArea}
            collapsable={false}
            style={[styles.whole, { backgroundColor: colours.paper }]}
            {...swiping.panHandlers}
          >
            <ScrollView
              ref={beneath}
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              pointerEvents="none"
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
              style={[StyleSheet.absoluteFill, { backgroundColor: colours.paper }]}
              scrollEnabled={false}
              contentContainerStyle={pageRoom}
              showsVerticalScrollIndicator={false}
            >
              {document.isPending || part === null ? null : (
                <TheBookText
                  nodes={nodes}
                  size={size}
                  leading={TEXT_LOOK.leading[settings.spacing]}
                  ink={colours.ink}
                  face={face}
                  onLink={ignoreLink}
                  onAnchors={ignoreAnchors}
                />
              )}
            </ScrollView>

            <Animated.View
              style={[
                styles.whole,
                styles.leaf,
                {
                  backgroundColor: colours.paper,
                  shadowOpacity: colours.isDark ? 0.6 : 0.18,
                  transform: [{ translateX: across }],
                },
              ]}
            >
              <ScrollView
                ref={scrolling}
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
                style={styles.whole}
                scrollEnabled={false}
                contentContainerStyle={pageRoom}
                showsVerticalScrollIndicator={false}
                onLayout={({ nativeEvent }) => {
                  setShown(nativeEvent.layout.height);
                }}
                onContentSizeChange={(_, height) => {
                  setTall(height);
                }}
              >
                {document.isPending || part === null ? (
                  <ASpinner colour={colours.ink} />
                ) : (
                  <Button
                    tone="bare"
                    holdsStill
                    label={
                      isShowingChrome
                        ? say('common.hideTheControls')
                        : say('common.showTheControls')
                    }
                    onPress={({ x }) => {
                      const across =
                        width - Math.max(margin, room.left + 8) - Math.max(margin, room.right + 8);

                      if (x < across / 3) {
                        turn(-1);
                      } else if (x > (across * 2) / 3) {
                        turn(1);
                      } else {
                        setIsShowingChrome((was) => !was);
                      }
                    }}
                  >
                    <TheBookText
                      nodes={nodes}
                      size={size}
                      leading={TEXT_LOOK.leading[settings.spacing]}
                      ink={colours.ink}
                      face={face}
                      onLink={followLink}
                      onAnchors={setAnchors}
                    />
                  </Button>
                )}

                {isAtTheEnd && next !== null ? (
                  <Button
                    tone="bold"
                    onPress={() => {
                      onChapter(next.id);
                    }}
                  >
                    {say('phone.aReader.aTextReader.onToTitle', { title: next.title })}
                  </Button>
                ) : null}
              </ScrollView>
            </Animated.View>

            <View
              pointerEvents="none"
              style={[styles.band, { backgroundColor: colours.paper, height: topRoom, top: 0 }]}
            >
              <View style={[styles.marker, { bottom: 0, top: room.top }]}>
                <Words size="small" lines={1} isCentred colour={withAlpha(colours.ink, QUIET)}>
                  {here === null ? book.title : (entries[here]?.title ?? book.title)}
                </Words>
              </View>
            </View>
            <View
              pointerEvents="none"
              style={[
                styles.band,
                {
                  backgroundColor: colours.paper,
                  bottom: 0,
                  height: Math.max(shown - topRoom - step, 0),
                },
              ]}
            >
              <View style={[styles.marker, { bottom: room.bottom, top: 0 }]}>
                <Words size="small" isCentred colour={withAlpha(colours.ink, QUIET)}>
                  {pageOfPages}
                </Words>
              </View>
            </View>
          </View>

          {curls ? (
            <AMatteCurl
              style={StyleSheet.absoluteFill}
              pages={leaves.pictures}
              page={page}
              paper={colours.paper}
              isLocked={isPanelOpen}
              onGrab={() => {
                lastTouched.current = Date.now();
              }}
              onTurn={(to) => {
                lastTouched.current = Date.now();
                setPage(to);

                if (drawing === null) {
                  scrolling.current?.scrollTo({ y: to * step, animated: false });
                }
              }}
              onMiddle={() => {
                setIsShowingChrome((was) => !was);
              }}
              onPastTheEnd={() => {
                if (part < last) {
                  goTo(part + 1, { within: 0 });
                } else if (next !== null) {
                  onChapter(next.id);
                }
              }}
              onBeforeTheStart={() => {
                if (part > 0) {
                  goTo(part - 1, { within: 1 });
                }
              }}
            />
          ) : null}
        </View>
      )}

      <AReaderPanel
        isOpen={isPanelOpen}
        title={book.title}
        placesAre={say('common.contents')}
        places={entries.map((entry, at) => ({
          id: at.toString(),
          label: entry.title,
          depth: entry.depth,
          isHere: at === here,
        }))}
        onPlace={(id) => {
          const entry = entries[Number(id)];

          setIsPanelOpen(false);

          if (entry !== undefined) {
            goTo(entry.part, entry.anchor === null ? { within: 0 } : { anchor: entry.anchor });
          }
        }}
        onClose={() => {
          setIsPanelOpen(false);
        }}
      >
        <AReadingLook
          theme={theme}
          onTheme={(chosen) => {
            choose({ theme: chosen });
          }}
          onSmaller={
            sizeAt <= 0
              ? null
              : () => {
                  const smaller = TEXT_SIZES[sizeAt - 1];

                  if (smaller !== undefined) {
                    choose({ size: smaller });
                  }
                }
          }
          onLarger={
            sizeAt >= TEXT_SIZES.length - 1
              ? null
              : () => {
                  const larger = TEXT_SIZES[sizeAt + 1];

                  if (larger !== undefined) {
                    choose({ size: larger });
                  }
                }
          }
        />
        <View style={styles.setting}>
          <Words size="small" tone="muted" isStrong>
            {say('phone.aReader.aReaderSheet.turningPages')}
          </Words>
          <SegmentedRow
            label={say('phone.aReader.aReaderSheet.turningPages')}
            fills
            items={[
              { id: 'pages', label: say('common.pages') },
              { id: 'scroll', label: say('common.scroll') },
            ]}
            value={settings.isScrolling ? 'scroll' : 'pages'}
            onSelect={(id) => {
              choose({ isScrolling: id === 'scroll' });
            }}
          />
          {settings.isScrolling ? null : (
            <ALabelledToggle
              label={say('screens.pageReader.animateTurningPages')}
              isOn={settings.isAnimated}
              onToggle={(isOn) => {
                choose({ isAnimated: isOn });
              }}
            />
          )}
        </View>
        <View style={styles.setting}>
          <Words size="small" tone="muted" isStrong>
            {say('phone.aReader.aTextReader.lineSpacing')}
          </Words>
          <SegmentedRow
            label={say('phone.aReader.aTextReader.lineSpacing')}
            fills
            items={choicesOf(TEXT_SPACINGS)}
            value={settings.spacing}
            onSelect={(id) => {
              const chosen = TEXT_SPACINGS.find((one) => one === id);

              if (chosen !== undefined) {
                choose({ spacing: chosen });
              }
            }}
          />
        </View>
        <View style={styles.setting}>
          <Words size="small" tone="muted" isStrong>
            {say('common.margins')}
          </Words>
          <SegmentedRow
            label={say('common.margins')}
            fills
            items={choicesOf(TEXT_MARGINS)}
            value={settings.margins}
            onSelect={(id) => {
              const chosen = TEXT_MARGINS.find((one) => one === id);

              if (chosen !== undefined) {
                choose({ margins: chosen });
              }
            }}
          />
        </View>
      </AReaderPanel>
    </AReaderChrome>
  );
};

ATextReader.displayName = 'ATextReader';

export { ATextReader };
