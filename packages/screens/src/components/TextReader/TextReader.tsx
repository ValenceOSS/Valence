import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Slider } from '@ValenceUI/Slider';
import { Spinner } from '@ValenceUI/Spinner';
import { cn } from '@ValenceUI/cn';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookText } from '@ValenceScreens/components/BookText/BookText';
import { ReaderChrome } from '@ValenceScreens/components/ReaderChrome/ReaderChrome';
import { ReaderPanel } from '@ValenceScreens/components/ReaderPanel/ReaderPanel';
import { ReaderPicker } from '@ValenceScreens/components/ReaderPicker/ReaderPicker';
import { readPanelPinned, writePanelPinned } from '@ValenceScreens/reading/panelPreference';
import { contentsEntryAt } from '@ValenceScreens/reading/contentsEntryAt';
import { fractionOfBook } from '@ValenceScreens/reading/fractionOfBook';
import { placeInBook } from '@ValenceScreens/reading/placeInBook';
import {
  TEXT_MARGINS,
  TEXT_PAGES,
  TEXT_SIZES,
  TEXT_SPACINGS,
  readTextPreferences,
  writeTextPreferences,
} from '@ValenceScreens/reading/textPreferences';
import { useChromeThatHides } from '@ValenceScreens/reading/useChromeThatHides';
import { useTurnKeys } from '@ValenceScreens/reading/useTurnKeys';
import type { TextPreferences } from '@ValenceScreens/reading/textPreferences';
import type { TextReaderProps } from './TextReader.types';

type Landing =
  | { kind: 'within'; within: number }
  | { kind: 'anchor'; anchor: string }
  | { kind: 'start' }
  | { kind: 'end' };

const GAP = 48;

const SERIF = 'ui-serif, "Iowan Old Style", "Palatino Linotype", Georgia, serif';

const TWO_COLUMNS_FROM = 960;

const A_SWIPE = 48;

const SLIDER_STEPS = 1000;

const SIZE_PX: Record<TextPreferences['size'], number> = {
  small: 16,
  medium: 19,
  large: 22,
  larger: 26,
};

const LEADING: Record<TextPreferences['spacing'], number> = {
  tight: 1.4,
  normal: 1.6,
  loose: 1.85,
};

const MARGIN: Record<TextPreferences['margins'], string> = {
  narrow: '4%',
  normal: '8%',
  wide: '14%',
};

const PAGE: Record<TextPreferences['page'], string> = {
  light: 'bg-paper-light text-ink-light',
  sepia: 'bg-paper-sepia text-ink-sepia',
  dark: 'bg-paper-dark text-ink-dark',
};

const NAMES: Record<string, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  larger: 'Larger',
  tight: 'Tight',
  normal: 'Normal',
  loose: 'Loose',
  narrow: 'Narrow',
  wide: 'Wide',
  light: 'Light',
  sepia: 'Sepia',
  dark: 'Dark',
};

/**
 * Reads a book whose text lays itself out on the screen it is shown on — an EPUB.
 *
 * A page is a column of text as wide as the screen allows, set in columns so that a turn is a page
 * rather than a scroll; a wide screen shows two columns side by side, as an open book would, rather
 * than one line as long as a monitor. How many pages a part makes is decided here, after it is laid
 * out, and again whenever the screen, the size of the text or a late-arriving picture changes it.
 *
 * Where somebody is up to is a fraction of the whole book rather than a page, because a page on a
 * phone is a third of one on a desktop. The parts are weighed by how much they hold, so the fraction
 * does not jump at the start of a long part. Opening a book goes back to that fraction; a link inside
 * the book, or an entry in its contents, goes to the place it names.
 *
 * The chrome, the keys and the edges to tap are the page reader's, so both kinds of book are read
 * the same way. The text settings — size, spacing, margins, and a light, sepia or dark page — are
 * its own, kept on the device.
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
  const [settings, setSettings] = useState<TextPreferences>(readTextPreferences);
  const { isShown, wake } = useChromeThatHides();
  const [isPanelPinned, setIsPanelPinned] = useState(readPanelPinned);
  const [isPanelOpen, setIsPanelOpen] = useState(isPanelPinned);
  const [part, setPart] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLaidOut, setIsLaidOut] = useState(false);
  const [landing, setLanding] = useState<Landing | null>(null);
  const [anchorPages, setAnchorPages] = useState<ReadonlyMap<string, number>>(new Map());
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [dragged, setDragged] = useState<number | null>(null);
  const viewport = useRef<HTMLDivElement | null>(null);
  const flow = useRef<HTMLDivElement | null>(null);
  const touchedAt = useRef<number | null>(null);
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
    const element = viewport.current;

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

  useLayoutEffect(() => {
    flow.current?.style.setProperty('--page-height', `${box.height.toString()}px`);
  }, [box.height, text.data]);

  const columns = box.width >= TWO_COLUMNS_FROM ? 2 : 1;
  const columnWidth = Math.max((box.width - GAP * (columns - 1)) / columns, 1);
  const step = box.width + GAP;

  const measure = useCallback(() => {
    const element = flow.current;

    if (element === null || box.width === 0) {
      return;
    }

    const count = Math.max(1, Math.round((element.scrollWidth + GAP) / step));
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

      setPage(Math.min(Math.max(landed, 0), count - 1));
    } else {
      setPage((was) => Math.min(was, count - 1));
    }

    setIsLaidOut(true);
  }, [box.width, contents.data, landing, part, step]);

  useLayoutEffect(() => {
    measure();
  }, [measure, text.data, settings, box]);

  const report = useRef(onPlaceChange);

  useEffect(() => {
    report.current = onPlaceChange;
  });

  const fraction = part === null ? startAt : fractionOfBook(sizes, part, page / pages);
  const isFinished = part === lastPart && page >= pages - 1;

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
      wake();

      if (part === null) {
        return;
      }

      const next = page + by;

      if (next >= pages) {
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
      setPage(next);
    },
    [goTo, lastPart, page, pages, part, wake],
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
    writeTextPreferences(next);
    setLanding({ kind: 'within', within: page / pages });
    wake();
  };

  const entries = contents.data?.contents ?? [];
  const current = part === null ? null : contentsEntryAt(entries, part, page, anchorPages);
  const heading = current === null ? null : (entries[current]?.title ?? null);

  if (contents.isError || text.isError) {
    return (
      <CouldNotRead
        what="That book"
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
        <p className="text-lg font-medium text-on-scrim">This book could not be opened</p>
        <p className="text-sm text-on-scrim/70">Its file may be damaged, or not an ebook at all.</p>
      </div>
    );
  }

  return (
    <div
      className={cn('valence-below-the-bar z-50 flex flex-col', PAGE[settings.page])}
      onPointerMove={wake}
      onTouchStart={(event) => {
        touchedAt.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const from = touchedAt.current;
        const to = event.changedTouches[0]?.clientX ?? null;

        touchedAt.current = null;

        if (from === null || to === null || Math.abs(to - from) < A_SWIPE) {
          return;
        }

        const wentLeft = to < from;

        (wentLeft === (book.direction === 'rightToLeft') ? back : forward)();
      }}
    >
      <ReaderChrome
        title={heading === null ? book.title : `${book.title} — ${heading}`}
        isShown={isShown}
        isRightToLeft={book.direction === 'rightToLeft'}
        onForward={forward}
        onBack={back}
        onClose={onClose}
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
                  label="Contents"
                  value={heading ?? 'The beginning'}
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
                  previousLabel="Previous chapter"
                  nextLabel="Next chapter"
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
            <SettingList>
              <SettingRow title="Size">
                <SegmentedRow
                  label="Size"
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

              <SettingRow title="Spacing">
                <SegmentedRow
                  label="Spacing"
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

              <SettingRow title="Margins">
                <SegmentedRow
                  label="Margins"
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

              <SettingRow title="Page">
                <SegmentedRow
                  label="Page"
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
              label="How far through the book"
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
        <div
          className="flex h-full w-full flex-col"
          style={{
            paddingInline: MARGIN[settings.margins],
            paddingBlock: '3.5rem',
          }}
        >
          <div ref={viewport} className="relative min-h-0 flex-1 overflow-hidden">
            {text.data === undefined || part === null ? (
              <Spinner isCentered label="Opening the book" />
            ) : (
              <div
                ref={flow}
                onLoadCapture={measure}
                className={cn(
                  'h-full [hyphens:auto]',
                  'transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out)] motion-reduce:transition-none',
                  isLaidOut ? 'opacity-100' : 'opacity-0',
                  '[&_p]:mb-[0.8em] [&_h1]:mb-[0.6em] [&_h1]:text-[1.6em] [&_h1]:font-semibold [&_h2]:mb-[0.6em] [&_h2]:text-[1.35em] [&_h2]:font-semibold [&_h3]:mb-[0.5em] [&_h3]:text-[1.15em] [&_h3]:font-semibold',
                  '[&_img]:mx-auto [&_img]:my-[0.8em] [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_img]:max-h-[var(--page-height)] [&_img]:[break-inside:avoid]',
                  '[&_blockquote]:mx-[1.5em] [&_blockquote]:italic [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-[1.25em] [&_ul]:list-disc [&_ol]:list-decimal [&_figcaption]:text-center [&_figcaption]:text-[0.85em]',
                )}
                style={{
                  columnWidth: `${columnWidth.toString()}px`,
                  columnGap: `${GAP.toString()}px`,
                  columnFill: 'auto',
                  fontSize: `${SIZE_PX[settings.size].toString()}px`,
                  lineHeight: LEADING[settings.spacing],
                  transform: `translateX(${(-page * step).toString()}px)`,
                  fontFamily: SERIF,
                }}
              >
                <BookText html={text.data} onFollow={follow} />
              </div>
            )}
          </div>
        </div>
      </ReaderChrome>
    </div>
  );
};

TextReader.displayName = 'TextReader';

export { TextReader };
