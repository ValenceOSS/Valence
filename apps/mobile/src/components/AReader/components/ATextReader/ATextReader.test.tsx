import { act, fireEvent, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchBookContents, fetchBookDocument } from '@ValenceClient/books/fetchBooks';
import { aBook } from '@ValenceMobile/testing/aBook';
import { aChapter } from '@ValenceMobile/testing/aChapter';
import { aBookmark } from '@ValenceMobile/testing/aBookmark';
import { aReaderMarks } from '@ValenceMobile/testing/aReaderMarks';
import type { AReaderMarks } from '@ValenceMobile/components/AReader/AReaderMarks';
import { ATextReader } from './ATextReader';

jest.mock('@ValenceMobile/platform/drawsNatively', () => ({
  drawsNatively: () => false,
}));

jest.mock('@ValenceClient/books/fetchBooks', () => ({
  ...jest.requireActual<object>('@ValenceClient/books/fetchBooks'),
  fetchBookContents: jest.fn(),
  fetchBookDocument: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchBookContents).mockResolvedValue({
    parts: [{ size: 100 }, { size: 100 }],
    contents: [
      { title: 'Book One', part: 0, anchor: null, depth: 0 },
      { title: 'Book Two', part: 1, anchor: null, depth: 0 },
    ],
  });
  jest.mocked(fetchBookDocument).mockResolvedValue('<h1>Dune</h1><p>A beginning is the time.</p>');
});

const aReader = (marks?: AReaderMarks) => (
  <ATextReader
    book={aBook()}
    chapterId={aChapter(1).id}
    startAtFraction={0}
    next={null}
    onChapter={jest.fn()}
    onFraction={jest.fn()}
    onBack={jest.fn()}
    {...(marks === undefined ? {} : { marks })}
  />
);

describe('ATextReader', () => {
  it('reads the section it opens in, naming it', async () => {
    const drawn = await render(aReader(), { wrapper: CacheScope });

    expect(await drawn.findByText('A beginning is the time.')).toBeTruthy();
    expect(drawn.getAllByText('Book One')).not.toHaveLength(0);
  });

  it('holds the contents and the text settings in its panel', async () => {
    const drawn = await render(aReader(), { wrapper: CacheScope });

    await userEvent.press(drawn.getByRole('button', { name: 'Contents and settings' }));

    expect(drawn.getByText('Themes')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Larger text' })).toBeTruthy();
    expect(drawn.container.queryAll((one) => one.props.text === 'Book Two')).not.toHaveLength(0);
  });
  it('offers no bookmark where the book keeps none', async () => {
    const drawn = await render(aReader(), { wrapper: CacheScope });

    await drawn.findByText('A beginning is the time.');

    expect(drawn.queryByRole('button', { name: 'Bookmark this page' })).toBeNull();
  });

  it('bookmarks the place showing, with the words that start there', async () => {
    const marks = aReaderMarks([aBookmark('1', { fraction: 0.7 })]);
    const drawn = await render(aReader(marks), { wrapper: CacheScope });

    await drawn.findByText('A beginning is the time.');
    await userEvent.press(drawn.getByRole('button', { name: 'Bookmark this page' }));

    expect(marks.onMark).toHaveBeenCalledWith({
      pageNumber: null,
      fraction: 0,
      pageShown: 1,
      excerpt: 'A beginning is the time.',
      picture: null,
    });
  });

  it('removes the bookmarks on the page showing, leaving the rest', async () => {
    const marks = aReaderMarks([
      aBookmark('1', { fraction: 0.2 }),
      aBookmark('2', { fraction: 0.7 }),
    ]);
    const drawn = await render(aReader(marks), { wrapper: CacheScope });

    await drawn.findByText('A beginning is the time.');
    await userEvent.press(drawn.getByRole('button', { name: 'Remove bookmark' }));

    expect(marks.onUnmark).toHaveBeenCalledWith([aBookmark('1').id]);
    expect(marks.onMark).not.toHaveBeenCalled();
  });

  it('lists the bookmarks in its panel, and goes to one chosen there', async () => {
    const marks = aReaderMarks(
      [],
      [
        {
          id: 'a',
          place: '70%',
          chapter: null,
          excerpt: 'Fear is the mind-killer.',
          picture: null,
        },
      ],
    );
    const drawn = await render(aReader(marks), { wrapper: CacheScope });

    await userEvent.press(drawn.getByRole('button', { name: 'Contents and settings' }));

    const [row] = drawn.container.queryAll((one) => one.props.text === 'Fear is the mind-killer.');

    expect(drawn.container.queryAll((one) => one.props.text === 'Bookmarks')).not.toHaveLength(0);
    expect(row).toBeDefined();

    await fireEvent(row ?? drawn.container, 'buttonPress');
    await act(
      () =>
        new Promise<void>((done) => {
          setTimeout(done, 450);
        }),
    );

    expect(marks.onOpen).toHaveBeenCalledWith('a');
  });
});
