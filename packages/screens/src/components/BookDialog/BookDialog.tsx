import { useMemo } from 'react';
import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';
import { useQuery } from '@tanstack/react-query';
import { chapterProgress } from '@ValenceClient/books/chapterProgress';
import { ChapterList } from './components/ChapterList/ChapterList';
import {
  BookOpen as BookOpenIcon,
  Headphones as HeadphonesIcon,
  Heart as HeartIcon,
  Share as ShareIcon,
  X as XIcon,
} from '@keyline-icons/react';
import { Heart as HeartFilledIcon } from '@keyline-icons/react/fill';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { ActionBar } from '@ValenceUI/ActionBar';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Skeleton } from '@ValenceUI/Skeleton';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { RatingPanel } from '@ValenceScreens/components/RatingPanel/RatingPanel';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import { readingFractionOf } from '@ValenceClient/books/readingFractionOf';
import { listenLabel } from '@ValenceClient/books/listenLabel';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { ActionBarAction } from '@ValenceUI/ActionBar.types';
import type { BookDialogProps } from './BookDialog.types';

/**
 * What kind of book something is, for the line above its title.
 *
 * @param book - The book.
 * @returns "Ebook" or "Audiobook" — both, where it can be read and heard — or how many chapters a
 *   comic has.
 */
const kindOf = (book: Book): string =>
  book.layout === 'audio'
    ? say('screens.bookDialog.audiobook')
    : book.layout === 'reflow'
      ? book.hasAudio === true
        ? say('screens.bookDialog.ebookAndAudiobook')
        : say('screens.bookDialog.ebook')
      : sayCount('screens.bookDialog.chapterCount', book.chapterCount);

/**
 * Everything a book can do, gathered where a film's are: its cover, who wrote it and what it is
 * about, how far through somebody is, what the household made of it, and the ways to read it, keep
 * it and hand it to somebody else.
 *
 * The button to read says whether it will start or carry on, and carries on from the place the
 * reader last left — the same as a film's resume. A book nobody has opened says so plainly rather
 * than showing an empty bar.
 *
 * @param bookId - The book, or null while the dialog is shut.
 * @param isKept - Whether this profile has kept it.
 * @param onClose - Told when it is dismissed.
 * @param onRead - Told to open the book in its reader.
 * @param onReadChapter - Told to open the book at a chapter chosen from its list.
 * @param onListen - Told to start listening to the book, where it can be heard.
 * @param onToggleKept - Told to keep it, or stop.
 * @param onRate - Told what somebody gave it, or null to take their rating back.
 * @param onShare - Told to hand out a link to it, where this profile may.
 */
const BookDialog = ({
  bookId,
  isKept,
  onClose,
  onRead,
  onReadChapter,
  onListen,
  onToggleKept,
  onRate,
  onShare,
}: BookDialogProps) => {
  const asked = useQuery({ ...bookQueries.one(bookId ?? ''), enabled: bookId !== null });
  const reading = useQuery({ ...bookQueries.reading(), enabled: bookId !== null });
  const book = asked.data?.book ?? null;
  const progress = useQuery({ ...bookQueries.progress(bookId ?? ''), enabled: bookId !== null });
  const readable = useMemo(
    () => (asked.data?.chapters ?? []).filter((chapter) => !isAudiobookFormat(chapter.format)),
    [asked.data],
  );
  const read = useMemo(
    () => chapterProgress(readable, progress.data ?? []),
    [readable, progress.data],
  );
  const where = (reading.data ?? []).find((one) => one.book.id === bookId) ?? null;
  const isStarted = where !== null && !where.isFinished;
  const mayListen = onListen !== undefined && book?.hasAudio === true;
  const heard = useQuery({
    ...bookQueries.listeningPlace(bookId ?? ''),
    enabled: bookId !== null && mayListen,
  });
  const isOnlyHeard = mayListen && book.hasText === false;

  const listen = () => {
    if (asked.data !== undefined && asked.data !== null) {
      onListen?.(asked.data);
    }
  };

  const actions: ActionBarAction[] =
    book === null
      ? []
      : [
          {
            id: 'keep',
            isPinned: true,
            label: isKept ? say('screens.bookDialog.stopKeeping') : say('screens.bookDialog.keep'),
            icon: <Icon of={HeartIcon} whenActive={HeartFilledIcon} isActive={isKept} size={18} />,
            onChoose: () => {
              onToggleKept(book);
            },
          },
          ...(mayListen && !isOnlyHeard
            ? [
                {
                  id: 'listen',
                  isPinned: true,
                  label: listenLabel(heard.data),
                  icon: <Icon of={HeadphonesIcon} size={18} />,
                  onChoose: listen,
                },
              ]
            : []),
          ...(onShare === undefined
            ? []
            : [
                {
                  id: 'share',
                  isPinned: true,
                  label: say('screens.bookDialog.share'),
                  icon: <Icon of={ShareIcon} size={18} />,
                  onChoose: () => {
                    onShare(book);
                  },
                },
              ]),
        ];

  return (
    <Dialog
      label={book?.title ?? say('screens.bookDialog.aBook')}
      isOpen={bookId !== null}
      onClose={onClose}
    >
      <DialogContent className="flex flex-col gap-7 p-4 sm:p-6">
        <div className="flex justify-end">
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            label={say('common.close')}
            onClick={onClose}
          >
            <Icon of={XIcon} size={18} />
          </Button>
        </div>

        {asked.isError ? (
          <CouldNotRead
            what={say('screens.bookDialog.thatBook')}
            isTryingAgain={asked.isFetching}
            onTryAgain={() => {
              void asked.refetch();
            }}
          />
        ) : book === null ? (
          <div className="flex gap-5">
            <Skeleton className="aspect-[2/3] w-32 shrink-0 sm:w-40" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-5">
              {book.hasCover ? (
                <img
                  src={bookCoverUrl(book.id)}
                  alt=""
                  className="aspect-[2/3] w-32 shrink-0 rounded-lg object-cover shadow-lg sm:w-40"
                />
              ) : (
                <div
                  aria-hidden
                  className="flex aspect-[2/3] w-32 shrink-0 items-center justify-center rounded-lg bg-surface-raised sm:w-40"
                >
                  <Icon of={BookOpenIcon} size={32} tone="muted" />
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col justify-end gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
                  {kindOf(book)}
                </span>

                <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-text">
                  {book.title}
                </h2>

                <p className="text-sm text-text-muted">
                  {[
                    book.authors === null ? null : book.authors.join(', '),
                    book.year === null ? null : book.year.toString(),
                  ]
                    .filter((part) => part !== null)
                    .join(' · ')}
                </p>

                {where === null ? null : (
                  <ProgressBar
                    label={say('screens.bookDialog.howFarThrough')}
                    value={Math.round(readingFractionOf(where) * 100)}
                    readout={
                      where.isFinished
                        ? say('screens.bookDialog.finished')
                        : describeReadingPlace(where)
                    }
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            <RatingPanel
              subject={{ bookId: book.id }}
              title={book.title}
              onRate={(stars) => {
                onRate(book, stars);
              }}
            />

            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-text-muted">
                {say('screens.bookDialog.about')}
              </h3>

              <p className="text-[0.95rem] leading-relaxed text-text">
                {book.overview ?? say('screens.bookDialog.noOverview')}
              </p>

              {(book.genres ?? []).length === 0 ? null : (
                <div className="flex flex-wrap gap-2">
                  {(book.genres ?? []).map((genre) => (
                    <Badge key={genre} size="sm">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            {readable.length < 2 || onReadChapter === undefined ? null : (
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-text-muted">
                  {say('screens.bookDialog.chapters')}
                </h3>

                <ChapterList
                  chapters={readable}
                  read={read}
                  onOpen={(chapterId) => {
                    onReadChapter(book, chapterId);
                  }}
                />
              </section>
            )}
          </>
        )}
      </DialogContent>

      <DialogFooter>
        <ActionBar
          label={say('screens.bookDialog.moreToDo')}
          primary={
            isOnlyHeard ? (
              <Button variant="confirm" size="lg" className="w-full" onClick={listen}>
                <Icon of={HeadphonesIcon} size={18} />
                {listenLabel(heard.data)}
              </Button>
            ) : (
              <Button
                variant="confirm"
                size="lg"
                className="w-full"
                disabled={book === null || book.hasText === false}
                onClick={() => {
                  if (book !== null) {
                    onRead(book);
                  }
                }}
              >
                <Icon of={BookOpenIcon} size={18} />
                {isStarted
                  ? say('screens.bookDialog.continueReading')
                  : where?.isFinished === true
                    ? say('screens.bookDialog.readAgain')
                    : say('screens.bookDialog.read')}
              </Button>
            )
          }
          actions={actions}
        />
      </DialogFooter>
    </Dialog>
  );
};

BookDialog.displayName = 'BookDialog';

export { BookDialog };
