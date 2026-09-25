import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchBookContents, fetchBookDocument } from '@ValenceClient/books/fetchBooks';
import { aBook } from '@ValenceMobile/testing/aBook';
import { aChapter } from '@ValenceMobile/testing/aChapter';
import { ATextReader } from './ATextReader';

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

const aReader = () => (
  <ATextReader
    book={aBook()}
    chapterId={aChapter(1).id}
    startAtFraction={0}
    next={null}
    onChapter={jest.fn()}
    onFraction={jest.fn()}
    onBack={jest.fn()}
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

    expect(drawn.getByText('Text size')).toBeTruthy();
    expect(drawn.getByText('Book Two')).toBeTruthy();
  });
});
