import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Slider } from '@ValenceUI/Slider';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { cn } from '@ValenceUI/cn';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookText } from '@ValenceScreens/components/BookText/BookText';
import { ReaderChrome } from '@ValenceScreens/components/ReaderChrome/ReaderChrome';
import { ReaderPanel } from '@ValenceScreens/components/ReaderPanel/ReaderPanel';
import { ReaderPicker } from '@ValenceScreens/components/ReaderPicker/ReaderPicker';
import { SpreadStage } from '@ValenceScreens/components/SpreadStage/SpreadStage';
import { groupHolding, spreadsFor } from '@ValenceClient/books/spreadsFor';
import { MOST_GAP } from '@ValenceClient/books/readerPreferences';
import { readPanelPinned, writePanelPinned } from '@ValenceScreens/reading/panelPreference';
import { contentsEntryAt } from '@ValenceClient/books/contentsEntryAt';
import { TEXT_LOOK } from '@ValenceClient/books/TEXT_LOOK';
import { fractionOfBook } from '@ValenceClient/books/fractionOfBook';
import { bookPageNumber } from '@ValenceClient/books/bookPageNumber';
import { placeInBook } from '@ValenceClient/books/placeInBook';
import {
  TEXT_MARGINS,
  TEXT_PAGES,
  TEXT_SIZES,
  TEXT_SPACINGS,
  readTextPreferences,
  writeTextPreferences,
} from '@ValenceClient/books/textPreferences';
import { useChromeThatHides } from '@ValenceScreens/reading/useChromeThatHides';
import { useTurnKeys } from '@ValenceScreens/reading/useTurnKeys';
import type { TextPreferences } from '@ValenceClient/books/textPreferences';
import type { TextReaderProps } from './TextReader.types';
import { say } from '@ValenceI18n/say';

type Landing =
  | { kind: 'within'; within: number }
  | { kind: 'anchor'; anchor: string }
  | { kind: 'start' }
  | { kind: 'end' };

const COLUMN_GAP = 48;

const STAGE_PADDING = 24;

const PAGE_RATIO = 0.68;

const TWO_PAGES_FROM = 900;

const TEXT_TOP = 44;

const TEXT_BOTTOM = 52;

const SERIF = 'ui-serif, "Iowan Old Style", "Palatino Linotype", Georgia, serif';

const SLIDER_STEPS = 1000;

const PAGE: Record<TextPreferences['page'], string> = {
  light: 'bg-paper-light text-ink-light',
  sepia: 'bg-paper-sepia text-ink-sepia',
  dark: 'bg-paper-dark text-ink-dark',
};

const FLOW = [
  'h-full [hyphens:auto] [&_:is(p,figcaption,blockquote)]:[font-family:inherit] [&_:is(p,figcaption,blockquote)]:tracking-normal',
  '[&_p]:mb-[0.8em] [&_h1]:mb-[0.6em] [&_h1]:text-[1.6em] [&_h1]:font-semibold [&_h2]:mb-[0.6em] [&_h2]:text-[1.35em] [&_h2]:font-semibold [&_h3]:mb-[0.5em] [&_h3]:text-[1.15em] [&_h3]:font-semibold',
  '[&_img]:mx-auto [&_img]:my-[0.8em] [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_img]:max-h-[var(--page-height)] [&_img]:[break-inside:avoid]',
  '[&_blockquote]:mx-[1.5em] [&_blockquote]:italic [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-[1.25em] [&_ul]:list-disc [&_ol]:list-decimal [&_figcaption]:text-center [&_figcaption]:text-[0.85em]',
].join(' ');

const NAMES: Record<string, string> = {
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

/**
 * Reads a book whose text lays itself out on the screen it is shown on — an EPUB — the way the page
 * reader reads a comic: pages of paper on a dark stage, one at a time or two side by side as an open
 * book, turned with the same curl, the same keys, the same edges to tap and the same panel.
 *
 * The text is set in columns exactly the size of the page's printed area, so each column is one
 * page, and a page is that column showing through a sheet of paper, numbered at its foot through
 * the whole book. How many pages a part makes is
 * decided here, after it is laid out, and again whenever the screen, the size of the text or a
 * late-arriving picture changes it.
 *
 * Where somebody is up to is a fraction of the whole book rather than a page, because a page on a
 * phone is a third of one on a desktop. The parts are weighed by how much they hold, so the fraction
 * does not jump at the start of a long part. Opening a book goes back to that fraction; a link inside
 * the book, or an entry in its contents, goes to the place it names.
 *
 * Only a single turn is animated. Arriving anywhere else — another part of the book, a link, the
 * slider, a change of settings — starts the stage afresh on the page arrived at, rather than leafing
 * through every page between where it was and where it landed.
 *
 * The text settings — size, spacing, margins, and a light, sepia or dark page — are its own, kept on
 * the device, beside the page reader's own choice of one page or two and whether turning is animated.
 *
 * @param book - The book.
 * @param chapterId - The file its text is in.
 * @param startAt - How far through to open, as a fraction of the whole book.
 * @param onPlaceChange - Told how far through somebody is after every turn, for remembering.
 * @param onClose - Told to leave.
 */
const TextReader = ({ book, chapterId, startAt = 0, onPlaceChange, onClose }: TextReaderProps) => {
  const cache = useQueryClient();
  const contents = useQuery(bookQueries.contents(book.id, chapterId));
  const sizes = useMemo(
    () => (contents.data ?? { parts: [] }).parts.map((part) => part.size),
    [contents.data],
  );
  const [settings, setSettings] = useState<TextPreferences>(() => readTextPreferences(book.id));
  const { isShown, wake, keep } = useChromeThatHides();
  const [isPanelPinned, setIsPanelPinned] = useState(readPanelPinned);
  const [isPanelOpen, setIsPanelOpen] = useState(isPanelPinned);
  const [part, setPart] = useState<number | null>(null);
  const [at, setAt] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLaidOut, setIsLaidOut] = useState(false);
  const [landing, setLanding] = useState<Landing | null>(null);
  const [arrivals, setArrivals] = useState(0);
  const [anchorPages, setAnchorPages] = useState<ReadonlyMap<string, number>>(new Map());
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [dragged, setDragged] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const flow = useRef<HTMLDivElement | null>(null);
  const lastPart = Math.max(sizes.length - 1, 0);

  const text = useQuery({
    ...bookQueries.document(book.id, chapterId, part ?? 0),
    enabled: part !== null,
  });

  useEffect(() => {
    if (contents.data === undefined || contents.data === null || part !== null) {
      return;
    }

    const opened = placeInBook(sizes, startAt);

    setPart(opened.part);
    setLanding({ kind: 'within', within: opened.within });
  }, [contents.data, part, sizes, startAt]);

  useEffect(() => {
    if (part !== null && part < lastPart) {
      void cache.prefetchQuery(bookQueries.document(book.id, chapterId, part + 1));
    }
  }, [book.id, cache, chapterId, lastPart, part]);

  useEffect(() => {
    const element = stage.current;

    if (element === null) {
      return undefined;
    }

    const watcher = new ResizeObserver(([entry]) => {
      if (entry !== undefined) {
        setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });

    watcher.observe(element);

    return () => {
      watcher.disconnect();
    };
  }, [text.data]);

  const across = settings.isDouble && box.width >= TWO_PAGES_FROM ? 2 : 1;
  const sheetHeight = Math.max(box.height - STAGE_PADDING * 2, 1);
  const sheetWidth = Math.max(
    Math.min(
      sheetHeight * PAGE_RATIO,
      (box.width - STAGE_PADDING * 2 - settings.gap * (across - 1)) / across,
    ),
    1,
  );
  const textInset = Math.max(20, sheetWidth * TEXT_LOOK.margin[settings.margins] * 1.6);
  const textWidth = Math.max(sheetWidth - textInset * 2, 1);
  const textHeight = Math.max(sheetHeight - TEXT_TOP - TEXT_BOTTOM, 1);
  const step = textWidth + COLUMN_GAP;

  const spreads = useMemo(
    () =>
      spreadsFor({ pageCount: pages, isDouble: across === 2, isOffset: false, wide: new Set() }),
    [across, pages],
  );
  const showing = spreads[Math.min(at, Math.max(spreads.length - 1, 0))] ?? [];
  const page = showing[0] ?? 0;

  const measure = useCallback(() => {
    const element = flow.current;

    if (element === null || box.width === 0) {
      return;
    }

    const count = Math.max(1, Math.round((element.scrollWidth + COLUMN_GAP) / step));
    const left = element.getBoundingClientRect().left;
    const found = new Map<string, number>();
    const named = new Map([...element.querySelectorAll('[id]')].map((one) => [one.id, one]));

    for (const entry of contents.data?.contents ?? []) {
      const anchor = entry.part === part ? entry.anchor : null;
      const target = anchor === null ? undefined : named.get(anchor);

      if (anchor !== null && target !== undefined) {
        found.set(anchor, Math.floor((target.getBoundingClientRect().left - left + 1) / step));
      }
    }

    const laid = spreadsFor({
      pageCount: count,
      isDouble: across === 2,
      isOffset: false,
      wide: new Set(),
    });

    setPages(count);
    setAnchorPages(found);

    if (landing !== null) {
      const landed =
        landing.kind === 'start'
          ? 0
          : landing.kind === 'end'
            ? count - 1
            : landing.kind === 'within'
              ? Math.floor(landing.within * count)
              : (found.get(landing.anchor) ?? 0);

      setAt(groupHolding(laid, Math.min(Math.max(landed, 0), count - 1)));
      setArrivals((was) => was + 1);
    } else {
      setAt((was) => Math.min(was, Math.max(laid.length - 1, 0)));
    }

    setIsLaidOut(true);
  }, [across, box.width, contents.data, landing, part, step]);

  useLayoutEffect(() => {
    measure();
  }, [measure, text.data, settings, box]);

  const report = useRef(onPlaceChange);

  useEffect(() => {
    report.current = onPlaceChange;
  });

  const fraction = part === null ? startAt : fractionOfBook(sizes, part, page / pages);
  const isFinished = part === lastPart && at >= spreads.length - 1;

  useEffect(() => {
    if (isLaidOut && part !== null) {
      report.current?.(fraction, isFinished);
    }
  }, [fraction, isFinished, isLaidOut, part]);

  const goTo = useCallback((to: number, arriving: Landing) => {
    setIsLaidOut(false);
    setPart(to);
    setLanding(arriving);
  }, []);

  const turn = useCallback(
    (by: number) => {
      keep();

      if (part === null) {
        return;
      }

      const next = at + by;

      if (next >= spreads.length) {
        if (part < lastPart) {
          goTo(part + 1, { kind: 'start' });
        }

        return;
      }

      if (next < 0) {
        if (part > 0) {
          goTo(part - 1, { kind: 'end' });
        }

        return;
      }

      setLanding(null);
      setAt(next);
    },
    [at, goTo, keep, lastPart, part, spreads.length],
  );

  const forward = useCallback(() => {
    turn(1);
  }, [turn]);

  const back = useCallback(() => {
    turn(-1);
  }, [turn]);

  useTurnKeys({ isRightToLeft: book.direction === 'rightToLeft', forward, back, onClose });

  const follow = useCallback(
    (place: { part: number; anchor: string | null }) => {
      wake();

      const arriving: Landing =
        place.anchor === null ? { kind: 'start' } : { kind: 'anchor', anchor: place.anchor };

      if (place.part === part) {
        setLanding(arriving);
      } else {
        goTo(place.part, arriving);
      }
    },
    [goTo, part, wake],
  );

  const change = (changed: Partial<TextPreferences>) => {
    const next = { ...settings, ...changed };

    setSettings(next);
    writeTextPreferences(next, book.id);
    setLanding({ kind: 'within', within: page / pages });
    wake();
  };

  const flowStyle = {
    width: `${textWidth.toString()}px`,
    height: `${textHeight.toString()}px`,
    columnWidth: `${textWidth.toString()}px`,
    columnGap: `${COLUMN_GAP.toString()}px`,
    columnFill: 'auto',
    fontSize: `${TEXT_LOOK.size[settings.size].toString()}px`,
    lineHeight: TEXT_LOOK.leading[settings.spacing],
    fontFamily: SERIF,
    '--page-height': `${textHeight.toString()}px`,
  } as const;

  const entries = contents.data?.contents ?? [];
  const current = part === null ? null : contentsEntryAt(entries, part, page, anchorPages);
  const heading = current === null ? null : (entries[current]?.title ?? null);

  if (contents.isError || text.isError) {
    return (
      <CouldNotRead
        said={say('common.thatBookCouldNotBeRead')}
        isTryingAgain={contents.isFetching || text.isFetching}
        onTryAgain={() => {
          void contents.refetch();
          void text.refetch();
        }}
      />
    );
  }

  if (contents.data === null || text.data === null) {
    return (
      <div className="valence-below-the-bar z-50 flex flex-col items-center justify-center gap-2 bg-shade text-center">
        <p className="text-lg font-medium text-on-scrim">{say('common.thatBookCouldNotBeRead')}</p>
        <p className="text-sm text-on-scrim/70">
          {say('screens.textReader.itsFileMayBeDamagedOr')}
        </p>
      </div>
    );
  }

  return (
    <div className="valence-below-the-bar z-50 flex flex-col bg-shade" onPointerMove={wake}>
      <ReaderChrome
        title={heading === null ? book.title : `${book.title} — ${heading}`}
        isShown={isShown}
        isRightToLeft={book.direction === 'rightToLeft'}
        onForward={forward}
        onBack={back}
        onClose={onClose}
        className="items-center justify-center"
        isPanelOpen={isPanelOpen}
        isPanelPinned={isPanelPinned}
        onPanelOpenChange={setIsPanelOpen}
        panel={
          <ReaderPanel
            bookTitle={book.title}
            placeTitle={heading}
            isPinned={isPanelPinned}
            onPinnedChange={(isPinned) => {
              setIsPanelPinned(isPinned);
              writePanelPinned(isPinned);
            }}
            onClose={() => {
              setIsPanelOpen(false);
            }}
            pickers={
              entries.length === 0 ? null : (
                <ReaderPicker
                  label={say('common.contents')}
                  value={heading ?? say('screens.textReader.theBeginning')}
                  selectedId={current === null ? '' : current.toString()}
                  options={entries.map((entry, at) => ({
                    id: at.toString(),
                    label: `${'\u2003'.repeat(entry.depth)}${entry.title}`,
                  }))}
                  onSelect={(id) => {
                    const entry = entries[Number(id)];

                    if (entry !== undefined) {
                      follow({ part: entry.part, anchor: entry.anchor });
                    }
                  }}
                  previousLabel={say('common.chapterBefore')}
                  nextLabel={say('common.nextChapter')}
                  {...(current !== null && current > 0
                    ? {
                        onPrevious: () => {
                          const entry = entries[current - 1];

                          if (entry !== undefined) {
                            follow({ part: entry.part, anchor: entry.anchor });
                          }
                        },
                      }
                    : {})}
                  {...((current ?? -1) < entries.length - 1
                    ? {
                        onNext: () => {
                          const entry = entries[(current ?? -1) + 1];

                          if (entry !== undefined) {
                            follow({ part: entry.part, anchor: entry.anchor });
                          }
                        },
                      }
                    : {})}
                />
              )
            }
          >
            <SettingList isInset>
              <SettingRow title={say('common.pages')}>
                <SegmentedRow
                  label={say('common.pages')}
                  size="sm"
                  items={[
                    { id: 'single', label: say('screens.pageReader.onePage') },
                    { id: 'double', label: say('screens.pageReader.twoPages') },
                  ]}
                  value={settings.isDouble ? 'double' : 'single'}
                  onSelect={(id) => {
                    change({ isDouble: id === 'double' });
                  }}
                />
              </SettingRow>

              {settings.isDouble ? (
                <SettingRow
                  title={say('screens.pageReader.gapBetweenPages')}
                  description={say('screens.pageReader.gapPx', {
                    gap: settings.gap.toString(),
                  })}
                >
                  <Slider
                    label={say('screens.pageReader.gapBetweenPages')}
                    value={settings.gap}
                    max={MOST_GAP}
                    onValueChange={(next) => {
                      change({ gap: next });
                    }}
                    className="w-40"
                  />
                </SettingRow>
              ) : null}

              <SettingRow title={say('screens.pageReader.animateTurningPages')}>
                <Switch
                  label={say('screens.pageReader.animateTurningPages')}
                  isLabelHidden
                  isOn={settings.isAnimated}
                  onToggle={() => {
                    change({ isAnimated: !settings.isAnimated });
                  }}
                />
              </SettingRow>

              <SettingRow title={say('common.size')}>
                <SegmentedRow
                  label={say('common.size')}
                  size="sm"
                  items={TEXT_SIZES.map((one) => ({ id: one, label: NAMES[one] ?? one }))}
                  value={settings.size}
                  onSelect={(id) => {
                    const size = TEXT_SIZES.find((one) => one === id);

                    if (size !== undefined) {
                      change({ size });
                    }
                  }}
                />
              </SettingRow>

              <SettingRow title={say('screens.textReader.spacing')}>
                <SegmentedRow
                  label={say('screens.textReader.spacing')}
                  size="sm"
                  items={TEXT_SPACINGS.map((one) => ({ id: one, label: NAMES[one] ?? one }))}
                  value={settings.spacing}
                  onSelect={(id) => {
                    const spacing = TEXT_SPACINGS.find((one) => one === id);

                    if (spacing !== undefined) {
                      change({ spacing });
                    }
                  }}
                />
              </SettingRow>

              <SettingRow title={say('common.margins')}>
                <SegmentedRow
                  label={say('common.margins')}
                  size="sm"
                  items={TEXT_MARGINS.map((one) => ({ id: one, label: NAMES[one] ?? one }))}
                  value={settings.margins}
                  onSelect={(id) => {
                    const margins = TEXT_MARGINS.find((one) => one === id);

                    if (margins !== undefined) {
                      change({ margins });
                    }
                  }}
                />
              </SettingRow>

              <SettingRow title={say('common.page')}>
                <SegmentedRow
                  label={say('common.page')}
                  size="sm"
                  items={TEXT_PAGES.map((one) => ({ id: one, label: NAMES[one] ?? one }))}
                  value={settings.page}
                  onSelect={(id) => {
                    const chosen = TEXT_PAGES.find((one) => one === id);

                    if (chosen !== undefined) {
                      change({ page: chosen });
                    }
                  }}
                />
              </SettingRow>
            </SettingList>
          </ReaderPanel>
        }
        footer={
          <>
            <Slider
              label={say('screens.bookDialog.howFarThrough')}
              tone="overlay"
              value={dragged ?? Math.round(fraction * SLIDER_STEPS)}
              max={SLIDER_STEPS}
              onValueChange={(value) => {
                setDragged(value);
                wake();
              }}
              onValueCommit={(value) => {
                const to = placeInBook(sizes, value / SLIDER_STEPS);

                setDragged(null);

                if (to.part === part) {
                  setLanding({ kind: 'within', within: to.within });
                } else {
                  goTo(to.part, { kind: 'within', within: to.within });
                }
              }}
              className="flex-1"
            />

            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-on-scrim/80">
              {`${Math.round(((dragged ?? fraction * SLIDER_STEPS) / SLIDER_STEPS) * 100).toString()}%`}
            </span>
          </>
        }
      >
        <div ref={stage} className="relative h-full w-full">
          {text.data === undefined || part === null ? (
            <Spinner isCentered label={say('common.openingTheBook')} />
          ) : (
            <>
              <div
                aria-hidden
                className="pointer-events-none invisible absolute top-0 left-0 overflow-hidden"
                style={{ width: textWidth, height: textHeight }}
              >
                <div ref={flow} onLoadCapture={measure} className={FLOW} style={flowStyle}>
                  <BookText html={text.data} onFollow={follow} />
                </div>
              </div>

              <div
                className={cn(
                  'h-full w-full transition-opacity duration-[var(--duration-fast)]',
                  isLaidOut ? 'opacity-100' : 'opacity-0',
                )}
              >
                <SpreadStage
                  spreads={spreads}
                  spreadAt={Math.min(at, Math.max(spreads.length - 1, 0))}
                  turnKey={`${chapterId}:${part.toString()}:${arrivals.toString()}`}
                  gap={settings.gap}
                  isRightToLeft={book.direction === 'rightToLeft'}
                  isAnimated={settings.isAnimated}
                  canGoBack={part > 0}
                  canGoOn={part < lastPart}
                  onTurn={turn}
                  renderPage={(number, isPageShown) => (
                    <div
                      data-reader-page
                      aria-hidden={!isPageShown}
                      className={cn(
                        'relative shrink-0 overflow-hidden rounded-md shadow-[var(--shadow-lifted)]',
                        PAGE[settings.page],
                        isPageShown ? '' : 'invisible',
                      )}
                      style={{ width: sheetWidth, height: sheetHeight }}
                    >
                      <div
                        className="absolute overflow-hidden"
                        style={{
                          left: textInset,
                          top: TEXT_TOP,
                          width: textWidth,
                          height: textHeight,
                        }}
                      >
                        <div
                          className={FLOW}
                          style={{
                            ...flowStyle,
                            transform: `translateX(${(-number * step).toString()}px)`,
                          }}
                        >
                          <BookText html={text.data ?? ''} onFollow={follow} />
                        </div>
                      </div>

                      <span
                        className="absolute inset-x-0 text-center text-xs tabular-nums opacity-55"
                        style={{ bottom: TEXT_BOTTOM / 2 - 8, fontFamily: SERIF }}
                      >
                        {bookPageNumber(sizes, part, pages, number).toString()}
                      </span>
                    </div>
                  )}
                />
              </div>
            </>
          )}
        </div>
      </ReaderChrome>
    </div>
  );
};

TextReader.displayName = 'TextReader';

export { TextReader };
