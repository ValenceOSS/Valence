import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { AReaderRail } from '@ValenceMobile/components/AReader/components/AReaderRail/AReaderRail';
import { AReaderSheet } from '@ValenceMobile/components/AReader/components/AReaderSheet/AReaderSheet';
import { AReaderSide } from '@ValenceMobile/components/AReader/components/AReaderSide/AReaderSide';
import { useTheSideStrip } from '@ValenceMobile/hooks/useTheSideStrip';
import { aBook } from '@ValenceMobile/testing/aBook';
import { aChapter } from '@ValenceMobile/testing/aChapter';
import { holdAWindowOf } from '@ValenceMobile/testing/holdAWindowOf';
import { APageReader } from './APageReader';
import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';

jest.mock('@ValenceMobile/hooks/useTheSideStrip', () => ({
  useTheSideStrip: jest.fn(() => null),
}));

jest.mock('@ValenceMobile/components/AReader/components/AReaderRail/AReaderRail', () => ({
  AReaderRail: jest.fn(() => null),
}));

jest.mock('@ValenceMobile/components/AReader/components/AReaderSide/AReaderSide', () => ({
  AReaderSide: jest.fn(() => null),
}));

jest.mock('@ValenceMobile/components/AReader/components/AReaderSheet/AReaderSheet', () => ({
  AReaderSheet: jest.fn(() => null),
}));

const COMIC = aBook({ title: 'One-Punch Man', layout: 'fixed' });

const CHAPTERS = [
  aChapter(1, { format: 'cbz', pageCount: 3 }),
  aChapter(2, { format: 'cbz', pageCount: 3 }),
];

const FIRST = CHAPTERS[0]?.id ?? '';

const SECOND = CHAPTERS[1]?.id ?? '';

const A_STRIP = { side: 'right', breadth: 70, freeFrom: 176, centreIn: 35 } as const;

beforeEach(() => {
  holdAWindowOf(393, 852);
  jest.mocked(useTheSideStrip).mockReturnValue(null);
  jest.mocked(AReaderRail).mockClear();
  jest.mocked(AReaderSide).mockClear();
  jest.mocked(AReaderSheet).mockClear();
});

const aReader = ({
  book = COMIC,
  chapters = CHAPTERS,
  chapterId = FIRST,
  startAtPage = 0,
  onChapter = jest.fn(),
  onPage = jest.fn(),
  onBack = jest.fn(),
}: {
  book?: Book;
  chapters?: BookChapter[];
  chapterId?: string;
  startAtPage?: number;
  onChapter?: (id: string) => void;
  onPage?: (page: number, isTheEnd: boolean) => void;
  onBack?: () => void;
} = {}) => (
  <APageReader
    book={book}
    chapters={chapters}
    chapterId={chapterId}
    startAtPage={startAtPage}
    onChapter={onChapter}
    onPage={onPage}
    onBack={onBack}
  />
);

/**
 * The system's page curl, as the reader drew it.
 *
 * @returns Where it was drawn.
 */
const theCurl = () => {
  const [curl] = screen.container.queryAll(
    (one) => one.type === 'ViewManagerAdapter_ValencePageCurl',
  );

  if (curl === undefined) {
    throw new Error('No page curl was drawn.');
  }

  return curl;
};

/**
 * Whether the bars over the page take touches, which they do only while showing.
 *
 * @returns Whether the bar holding the way back takes them.
 */
const doTheBarsTakeTouches = () => {
  let at = screen.getByRole('button', { name: 'Back' }).parent;

  while (at !== null && at.props.pointerEvents === undefined) {
    at = at.parent;
  }

  return at !== null && at.props.pointerEvents !== 'none';
};

/**
 * What the reader last handed its sheet of contents and settings.
 *
 * @returns Its props.
 */
const theSheet = () => {
  const props = jest.mocked(AReaderSheet).mock.lastCall?.[0];

  if (props === undefined) {
    throw new Error('No sheet was drawn.');
  }

  return props;
};

/**
 * What the reader last handed the controls down the side strip.
 *
 * @returns Their props.
 */
const theRail = () => {
  const props = jest.mocked(AReaderRail).mock.lastCall?.[0];

  if (props === undefined) {
    throw new Error('No rail was drawn.');
  }

  return props;
};

/**
 * What the reader last handed the panel on the far side of the book.
 *
 * @returns Its props.
 */
const theSide = () => {
  const props = jest.mocked(AReaderSide).mock.lastCall?.[0];

  if (props === undefined) {
    throw new Error('No far side was drawn.');
  }

  return props;
};

describe('APageReader', () => {
  it('hands the page curl every page of the chapter, one at a time upright, from the page asked', async () => {
    const onPage = jest.fn();

    await render(aReader({ startAtPage: 1, onPage }));

    expect(theCurl()).toHaveProp(
      'pages',
      [0, 1, 2].map(
        (one) => `/api/books/${COMIC.id}/chapters/${FIRST}/pages/${one.toString()}?width=1179`,
      ),
    );
    expect(theCurl()).toHaveProp('page', 1);
    expect(theCurl()).toHaveProp('isTwoUp', false);
    expect(theCurl()).toHaveProp('isRightToLeft', false);
    expect(theCurl()).toHaveProp('fit', 'both');
    expect(theCurl()).toHaveProp('isLocked', false);
    expect(screen.getByText('Page 2 of 3')).toBeTruthy();
    expect(onPage).toHaveBeenCalledWith(1, false);
  });

  it('shows two pages at once in a window wider than it is tall', async () => {
    holdAWindowOf(852, 393);

    await render(aReader());

    expect(theCurl()).toHaveProp('isTwoUp', true);
  });

  it('turns right to left for a book read that way', async () => {
    await render(aReader({ book: aBook({ ...COMIC, direction: 'rightToLeft' }) }));

    expect(theCurl()).toHaveProp('isRightToLeft', true);
  });

  it('says which page the curl turned to, and offers the next chapter from the last', async () => {
    const onPage = jest.fn();
    const onChapter = jest.fn();

    await render(aReader({ onPage, onChapter }));
    await fireEvent(theCurl(), 'turn', { nativeEvent: { page: 2 } });

    expect(onPage).toHaveBeenLastCalledWith(2, false);
    expect(theCurl()).toHaveProp('page', 2);
    expect(screen.getByText('Page 3 of 3')).toBeTruthy();

    await userEvent.press(screen.getByText('Read on: Chapter 2'));

    expect(onChapter).toHaveBeenCalledWith(SECOND);
  });

  it('marks the book finished on the last page of its last chapter', async () => {
    const onPage = jest.fn();

    await render(aReader({ chapterId: SECOND, onPage }));
    await fireEvent(theCurl(), 'turn', { nativeEvent: { page: 2 } });

    expect(onPage).toHaveBeenLastCalledWith(2, true);
    expect(screen.queryByText(/^Read on/)).toBeNull();
  });

  it('hides the bars on a tap in the middle of the page, and brings them back on another', async () => {
    await render(aReader());

    expect(doTheBarsTakeTouches()).toBe(true);

    await fireEvent(theCurl(), 'middle');

    expect(doTheBarsTakeTouches()).toBe(false);

    await fireEvent(theCurl(), 'middle');

    expect(doTheBarsTakeTouches()).toBe(true);
  });

  it('opens the next chapter when turned past the last page', async () => {
    const onChapter = jest.fn();

    await render(aReader({ onChapter }));
    await fireEvent(theCurl(), 'pastTheEnd');

    expect(onChapter).toHaveBeenCalledWith(SECOND);
  });

  it('opens nothing when turned past the end of the last chapter', async () => {
    const onChapter = jest.fn();

    await render(aReader({ chapterId: SECOND, onChapter }));
    await fireEvent(theCurl(), 'pastTheEnd');

    expect(onChapter).not.toHaveBeenCalled();
  });

  it('says when a chapter has no pages, and goes back', async () => {
    const onBack = jest.fn();

    await render(aReader({ chapters: [aChapter(1, { format: 'cbz', pageCount: null })], onBack }));

    expect(screen.getByText('This chapter has no pages to show.')).toBeTruthy();

    await userEvent.press(screen.getByText('Back'));

    expect(onBack).toHaveBeenCalled();
  });

  it('brings out its sheet, and opens another chapter picked there but not the one already open', async () => {
    const onChapter = jest.fn();

    await render(aReader({ onChapter }));

    expect(theSheet().isOpen).toBe(false);

    await userEvent.press(screen.getByRole('button', { name: 'Contents and settings' }));

    expect(theSheet().isOpen).toBe(true);

    await act(() => {
      theSheet().onChapter(FIRST);
    });

    expect(onChapter).not.toHaveBeenCalled();
    expect(theSheet().isOpen).toBe(false);

    await act(() => {
      theSheet().onChapter(SECOND);
    });

    expect(onChapter).toHaveBeenCalledWith(SECOND);
  });

  it('turns the pages the way chosen in its sheet, and sits the cover alone or not', async () => {
    await render(aReader());

    expect(theSheet().layout).toBe('one');

    await act(() => {
      theSheet().onRightToLeft(true);
    });
    await act(() => {
      theSheet().onCoverAlone(false);
    });

    expect(theCurl()).toHaveProp('isRightToLeft', true);
    expect(theCurl()).toHaveProp('isCoverAlone', false);
  });

  it('puts its controls in the strip down the side of a folding phone, instead of bars over the page', async () => {
    jest.mocked(useTheSideStrip).mockReturnValue(A_STRIP);

    const onBack = jest.fn();

    await render(aReader({ startAtPage: 1, onBack }));

    expect(screen.queryByText('Page 2 of 3')).toBeNull();
    expect(jest.mocked(AReaderSide)).not.toHaveBeenCalled();
    expect(theRail()).toMatchObject({
      side: 'right',
      breadth: 70,
      page: 1,
      onBack,
      onReadOn: null,
    });
    expect(theRail().pictures).toHaveLength(3);
    expect(theSheet().layout).toBeNull();

    await act(() => {
      theRail().onPanel();
    });

    expect(theSheet().isOpen).toBe(true);

    await act(() => {
      theRail().onPage(2);
    });

    expect(theCurl()).toHaveProp('page', 2);
    expect(theRail().onReadOn).not.toBeNull();
  });

  it('opened out to two pages, puts a panel on the far side that turns, holds, marks and fits them', async () => {
    jest.mocked(useTheSideStrip).mockReturnValue(A_STRIP);
    holdAWindowOf(852, 600);

    await render(aReader());

    expect(theSide()).toMatchObject({ side: 'left', isMarked: false, isLocked: false });

    await act(() => {
      theSide().onLock();
    });

    expect(theCurl()).toHaveProp('isLocked', true);

    await act(() => {
      theSide().onMark();
    });

    expect(theSide().isMarked).toBe(true);

    await act(() => {
      theSide().onFit();
    });

    expect(theCurl()).toHaveProp('fit', 'width');

    await act(() => {
      theSide().onForward();
    });

    expect(theCurl()).toHaveProp('page', 2);
    expect(theSide().next).toMatchObject({ title: 'Chapter 2' });
  });
});
