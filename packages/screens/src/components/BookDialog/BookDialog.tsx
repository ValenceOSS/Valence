import { useMemo, useRef } from 'react';
import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';
import { useQuery } from '@tanstack/react-query';
import { chapterProgress } from '@ValenceClient/books/chapterProgress';
import { ChapterList } from './components/ChapterList/ChapterList';
import { AuthorAbout } from './components/AuthorAbout/AuthorAbout';
import { CatalogueBookRow } from './components/CatalogueBookRow/CatalogueBookRow';
import {
  BookOpen as BookOpenIcon,
  Headphones as HeadphonesIcon,
  Info as InfoIcon,
  Share as ShareIcon,
  X as XIcon,
} from '@keyline-icons/react';
import { BookOpen as BookOpenFilledIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Skeleton } from '@ValenceUI/Skeleton';
import { useHasScrolledPast } from '@ValenceUI/useHasScrolledPast';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { RatingPanel } from '@ValenceScreens/components/RatingPanel/RatingPanel';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import { readingFractionOf } from '@ValenceClient/books/readingFractionOf';
import { listenLabel } from '@ValenceClient/books/listenLabel';
import { KeepHeart } from '@ValenceScreens/components/KeepHeart/KeepHeart';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { DialogSections } from '@ValenceScreens/components/DialogSections/DialogSections';
import { DialogHeadline } from '@ValenceScreens/components/DialogHeadline/DialogHeadline';
import { DialogHeadlinePart } from '@ValenceScreens/components/DialogHeadlinePart/DialogHeadlinePart';
import { DialogArrival } from '@ValenceScreens/components/DialogArrival/DialogArrival';
import { ScrolledTitle } from '@ValenceScreens/components/ScrolledTitle/ScrolledTitle';
import { TitleHero } from '@ValenceScreens/components/TitleHero/TitleHero';
import { TintedGround } from '@ValenceScreens/components/TintedGround/TintedGround';
import { ArtworkCloseButton } from '@ValenceScreens/components/ArtworkCloseButton/ArtworkCloseButton';
import { RoundActions } from '@ValenceScreens/components/RoundActions/RoundActions';
import { useArtworkTint } from '@ValenceScreens/library/useArtworkTint';
import { useAudiobookDownloadAction } from '@ValenceScreens/downloads/useAudiobookDownloadAction';
import { PluginPanels } from '@ValenceScreens/components/PluginPanels/PluginPanels';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { ActionBarAction } from '@ValenceUI/ActionBar.types';
import type { BookDialogProps } from './BookDialog.types';
import { plainTextOf } from '@ValenceCore/functions/plainTextOf';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const MOST_SUBJECTS_SHOWN = 8;

/**
 * What kind of book something is, for the facts under its title.
 *
 * @param book - The book.
 * @returns "Ebook" or "Audiobook" — both, where it can be read and heard — or how many chapters a
 *   comic has.
 */
const kindOf = (book: Book): string =>
  book.layout === 'audio'
    ? say('common.audiobook')
    : book.layout === 'reflow'
      ? book.hasAudio === true
        ? say('screens.bookDialog.ebookAndAudiobook')
        : say('common.ebook')
      : sayCount('common.count.chapters', book.chapterCount);

/**
 * Everything a book can do and everything known of it, laid out as a film's is: its cover large over
 * a wash of its own colours, with the way to read it — carrying on from where the reader left off —
 * and what else can be done with it beside; then what it is about, the facts of it as Open Library
 * has them — when it was first published, how long it is, who published it and how its readers
 * rated it — and what the household made of it; its chapters; who wrote it; and the books by them
 * and the books like it, each opening its own dialog where the library holds it or the dialog that
 * asks for it where it does not.
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
 * @param onOpenBook - Told to open another book the library holds.
 * @param onAsk - Told to open a book to ask for, as its address names it, and left out for whoever
 *   may not request.
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
  onOpenBook,
  onAsk,
}: BookDialogProps) => {
  const topRef = useRef<HTMLDivElement>(null);
  const { mark: pastTheCover, hasPassed: hasScrolledPast } = useHasScrolledPast();
  const asked = useQuery({ ...bookQueries.one(bookId ?? ''), enabled: bookId !== null });
  const reading = useQuery({ ...bookQueries.reading(), enabled: bookId !== null });
  const book = asked.data?.book ?? null;
  const author = book?.authors?.[0] ?? null;
  const about = useQuery(requestsQueries.bookAbout(book?.title ?? null, author, bookId !== null));
  const known = about.data ?? null;
  const cover = book?.hasCover === true ? bookCoverUrl(book.id) : null;
  const tint = useArtworkTint(cover);
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
  const written = book?.overview ?? known?.overview ?? null;
  const overview = written === null ? null : plainTextOf(written);
  const subjects = (book?.genres ?? []).length > 0 ? (book?.genres ?? []) : (known?.subjects ?? []);
  const year = book?.year ?? known?.firstPublished ?? null;

  const listen = () => {
    if (asked.data !== undefined && asked.data !== null) {
      onListen?.(asked.data);
    }
  };

  const downloadAction = useAudiobookDownloadAction(asked.data ?? null);
  const actions: ActionBarAction[] =
    book === null
      ? []
      : [
          {
            id: 'keep',
            isPinned: true,
            label: isKept ? say('screens.bookDialog.stopKeeping') : say('screens.bookDialog.keep'),
            icon: <KeepHeart isKept={isKept} size={18} />,
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
          ...(downloadAction === null ? [] : [downloadAction]),
          ...(onShare === undefined
            ? []
            : [
                {
                  id: 'share',
                  isPinned: true,
                  label: say('common.share'),
                  icon: <Icon of={ShareIcon} size={18} />,
                  onChoose: () => {
                    onShare(book);
                  },
                },
              ]),
        ];

  const facts =
    book === null
      ? []
      : [
          kindOf(book),
          year === null ? null : year.toString(),
          known?.pages === null || known?.pages === undefined
            ? null
            : sayCount('common.count.pages', known.pages),
          known?.editions === null || known?.editions === undefined || known.editions < 2
            ? null
            : sayCount('common.count.editions', known.editions),
        ].filter((part) => part !== null);

  const primary =
    book === null ? null : isOnlyHeard ? (
      <Button variant="confirm" size="lg" className="w-full" onClick={listen}>
        <Icon of={HeadphonesIcon} size={18} />
        {listenLabel(heard.data)}
      </Button>
    ) : (
      <Button
        variant="confirm"
        size="lg"
        className="w-full"
        disabled={book.hasText === false}
        onClick={() => {
          onRead(book);
        }}
      >
        <Icon of={BookOpenFilledIcon} size={18} />
        {isStarted
          ? say('common.continueReading')
          : where?.isFinished === true
            ? say('common.readAgain')
            : say('common.read')}
      </Button>
    );

  return (
    <Dialog
      label={book?.title ?? say('screens.bookDialog.aBook')}
      isOpen={bookId !== null}
      onClose={onClose}
      size="stage"
      edge={tint}
    >
      <DialogContent className="p-3 sm:p-4">
        <ScrolledTitle
          title={book?.title ?? ''}
          artwork={cover}
          detail={<span className="text-xs text-text-muted">{facts.join(' · ')}</span>}
          isShowing={hasScrolledPast}
          tint={tint}
        >
          <Button
            isIconOnly
            variant="confirm"
            size="sm"
            label={say('common.close')}
            onClick={onClose}
          >
            <Icon of={XIcon} size={16} />
          </Button>
        </ScrolledTitle>

        <TintedGround tint={tint}>
          {asked.isError ? (
            <div className="flex flex-col gap-4 pt-12">
              <CouldNotRead
                said={say('common.thatBookCouldNotBeRead')}
                isTryingAgain={asked.isFetching}
                onTryAgain={() => {
                  void asked.refetch();
                }}
              />
            </div>
          ) : book === null ? (
            <div className="flex gap-6 pt-14">
              <Skeleton className="aspect-[2/3] w-36 shrink-0 sm:w-48" />
              <div className="flex flex-1 flex-col justify-end gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : (
            <DialogArrival key={book.id}>
              <TitleHero
                ref={topRef}
                corner={<ArtworkCloseButton onClose={onClose} />}
                preview={
                  cover === null ? (
                    <div aria-hidden className="absolute inset-0 bg-[var(--surface-hover)]" />
                  ) : (
                    <div aria-hidden className="absolute inset-0 overflow-hidden">
                      <img
                        src={cover}
                        alt=""
                        className="size-full scale-125 object-cover opacity-70 blur-3xl"
                      />
                    </div>
                  )
                }
              >
                <DialogHeadline className="flex flex-col gap-6 sm:flex-row sm:items-end">
                  <DialogHeadlinePart className="w-32 shrink-0 sm:w-44">
                    {cover === null ? (
                      <span className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-surface-raised shadow-2xl">
                        <Icon of={BookOpenIcon} size={36} tone="muted" />
                      </span>
                    ) : (
                      <img
                        src={cover}
                        alt=""
                        className="aspect-[2/3] w-full rounded-lg object-cover shadow-2xl"
                      />
                    )}
                  </DialogHeadlinePart>

                  <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      {book.series === null || book.series === undefined ? null : (
                        <DialogHeadlinePart
                          as="span"
                          className="text-sm font-medium text-on-scrim/80"
                        >
                          {book.series.position === null
                            ? book.series.name
                            : `${book.series.name} · ${book.series.position.toString()}`}
                        </DialogHeadlinePart>
                      )}

                      <DialogHeadlinePart
                        as="h2"
                        isTitle
                        className="max-w-[22ch] text-[clamp(1.75rem,4.5vw,3rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-on-scrim"
                      >
                        {book.title}
                      </DialogHeadlinePart>

                      {book.authors === null || book.authors.length === 0 ? null : (
                        <DialogHeadlinePart as="span" className="text-base text-on-scrim/85">
                          {book.authors.join(', ')}
                        </DialogHeadlinePart>
                      )}
                    </div>

                    {where === null ? null : (
                      <DialogHeadlinePart className="max-w-[24rem] text-on-scrim">
                        <ProgressBar
                          label={say('screens.bookDialog.howFarThrough')}
                          value={Math.round(readingFractionOf(where) * 100)}
                          isFull
                          readout={
                            <span className="text-xs whitespace-nowrap">
                              {where.isFinished
                                ? say('common.finished')
                                : describeReadingPlace(where)}
                            </span>
                          }
                        />
                      </DialogHeadlinePart>
                    )}

                    <DialogHeadlinePart className="flex w-full flex-wrap items-center gap-3">
                      <div className="w-full md:w-[18rem]">{primary}</div>

                      <RoundActions
                        label={say('screens.bookDialog.moreToDoWithThisBook')}
                        actions={actions}
                        isCompact
                        className="md:ml-auto"
                      />
                    </DialogHeadlinePart>
                  </div>
                </DialogHeadline>
              </TitleHero>

              <span ref={pastTheCover} aria-hidden className="block h-px" />

              <DialogHeadline className="grid gap-x-12 gap-y-6 px-1 pt-2 sm:px-2 md:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
                <div className="flex min-w-0 flex-col gap-4">
                  <DialogHeadlinePart className="text-base text-text-muted">
                    {facts.join(' · ')}
                  </DialogHeadlinePart>

                  <DialogHeadlinePart>
                    {overview === null && about.isPending ? (
                      <div aria-hidden className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-[92%]" />
                        <Skeleton className="h-4 w-[70%]" />
                      </div>
                    ) : overview === null ? (
                      <p className="flex items-center gap-2 text-sm text-text-muted">
                        <Icon of={InfoIcon} size={16} />
                        {say('screens.bookDialog.nothingIsWrittenAboutThisBook')}
                      </p>
                    ) : (
                      <p className="max-w-[65ch] whitespace-pre-line text-base leading-relaxed text-text">
                        {overview}
                      </p>
                    )}
                  </DialogHeadlinePart>

                  {subjects.length === 0 ? null : (
                    <DialogHeadlinePart className="flex flex-wrap gap-2">
                      {subjects.slice(0, MOST_SUBJECTS_SHOWN).map((subject) => (
                        <Badge key={subject} size="sm">
                          {subject}
                        </Badge>
                      ))}
                    </DialogHeadlinePart>
                  )}
                </div>

                <DialogHeadlinePart className="flex flex-col gap-3 text-sm leading-relaxed">
                  {known === null || known.firstPublished === null ? null : (
                    <p>
                      <span className="text-text-muted">
                        {say('screens.bookDialog.firstPublished')}:{' '}
                      </span>
                      <span className="text-text">{known.firstPublished.toString()}</span>
                    </p>
                  )}

                  {known === null || known.publishers.length === 0 ? null : (
                    <p>
                      <span className="text-text-muted">
                        {say('screens.bookDialog.publisher')}:{' '}
                      </span>
                      <span className="text-text">{known.publishers[0]}</span>
                    </p>
                  )}

                  {known === null || known.rating === null ? null : (
                    <p>
                      <span className="text-text-muted">
                        {say('screens.bookDialog.readersRating')}:{' '}
                      </span>
                      <span className="text-text">
                        {say('screens.bookDialog.ratingOutOfFive', {
                          rating: known.rating.average.toFixed(1),
                        })}
                      </span>
                      <span className="text-text-muted">
                        {' · '}
                        {sayCount('screens.bookDialog.count.ratings', known.rating.count)}
                      </span>
                    </p>
                  )}

                  {known === null || known.readers === null ? null : (
                    <p className="text-text-muted">
                      {sayCount('screens.bookDialog.count.haveRead', known.readers.haveRead)}
                      {' · '}
                      {sayCount('screens.bookDialog.count.wantToRead', known.readers.wantToRead)}
                    </p>
                  )}

                  <RatingPanel
                    subject={{ bookId: book.id }}
                    title={book.title}
                    isBare
                    onRate={(stars) => {
                      onRate(book, stars);
                    }}
                  />
                </DialogHeadlinePart>
              </DialogHeadline>

              <DialogSections isOpen className="flex flex-col gap-10 px-1 pb-8 pt-10 sm:px-2">
                <PluginPanels on="book" subjectId={book.id} />

                {readable.length < 2 || onReadChapter === undefined ? null : (
                  <DialogSection heading={say('common.chapters')}>
                    <ChapterList
                      chapters={readable}
                      read={read}
                      onOpen={(chapterId) => {
                        onReadChapter(book, chapterId);
                      }}
                    />
                  </DialogSection>
                )}

                {known === null || known.author === null ? null : (
                  <AuthorAbout author={known.author} />
                )}

                {known === null ? null : (
                  <CatalogueBookRow
                    heading={say('screens.bookDialog.moreByName', {
                      name: known.author?.name ?? author ?? '',
                    })}
                    titles={known.byAuthor}
                    onOpenBook={onOpenBook}
                    {...(onAsk === undefined ? {} : { onAsk })}
                  />
                )}

                {known === null ? null : (
                  <CatalogueBookRow
                    heading={say('screens.bookDialog.booksLikeThis')}
                    titles={known.alike}
                    isByOthers
                    onOpenBook={onOpenBook}
                    {...(onAsk === undefined ? {} : { onAsk })}
                  />
                )}

                {known === null ? null : (
                  <p className="text-xs text-text-muted">
                    {say('screens.bookDialog.fromOpenLibrary')}
                  </p>
                )}
              </DialogSections>
            </DialogArrival>
          )}
        </TintedGround>
      </DialogContent>
    </Dialog>
  );
};

BookDialog.displayName = 'BookDialog';

export { BookDialog };
