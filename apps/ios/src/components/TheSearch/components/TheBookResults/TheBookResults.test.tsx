import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { findBooks } from '@ValenceClient/books/fetchBooks';
import { aBook } from '@ValencePhone/testing/aBook';
import { TheBookResults } from './TheBookResults';

jest.mock('@ValenceClient/books/fetchBooks', () => ({
  ...jest.requireActual<object>('@ValenceClient/books/fetchBooks'),
  findBooks: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheBookResults', () => {
  it('shows the books that match, each opening its page', async () => {
    jest.mocked(findBooks).mockResolvedValue([aBook()]);
    const onBook = jest.fn();
    const drawn = await render(<TheBookResults asked="dune" isOnItsOwn onBook={onBook} />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByRole('button', { name: 'Dune' }));

    expect(onBook).toHaveBeenCalledWith(aBook().id);
  });

  it('says nothing matches on its own, and stays away beside other results', async () => {
    jest.mocked(findBooks).mockResolvedValue([]);
    const alone = await render(<TheBookResults asked="zzz" isOnItsOwn onBook={jest.fn()} />, {
      wrapper: CacheScope,
    });

    expect(await alone.findByText('Nothing matches “zzz”')).toBeTruthy();
  });
});
