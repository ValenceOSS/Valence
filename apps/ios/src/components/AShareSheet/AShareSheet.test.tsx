import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { createShare } from '@ValenceClient/sharing/fetchShares';
import { aBook } from '@ValencePhone/testing/aBook';
import { AShareSheet } from './AShareSheet';
import { chooseIn } from '@ValencePhone/testing/chooseIn';
import { theChoicesIn } from '@ValencePhone/testing/theChoicesIn';

jest.mock('@ValenceClient/sharing/fetchShares', () => ({
  ...jest.requireActual<object>('@ValenceClient/sharing/fetchShares'),
  createShare: jest.fn(),
}));

const MADE = {
  id: '00000000-0000-4000-8000-00000000005a',
  kind: 'book' as const,
  mediaId: null,
  seriesId: null,
  bookId: aBook().id,
  title: 'Dune',
  createdAt: '2026-09-23T10:00:00.000Z',
  expiresAt: null,
  viewCap: null,
  views: 0,
  isRevoked: false,
  isSpent: false,
  token: 'abc',
};

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

describe('AShareSheet', () => {
  it('asks for a link as chosen, and shows it once made', async () => {
    jest.mocked(createShare).mockResolvedValue(MADE);
    const drawn = await render(
      <AShareSheet subject={{ kind: 'book', book: aBook() }} onClose={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('Share Dune')).toBeTruthy();

    await chooseIn('How long the link lasts', 'A day');
    await userEvent.press(drawn.getByText('Make a link'));

    expect(createShare).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'book', bookId: aBook().id }),
    );
    expect(await drawn.findByText('http://one.local:8420/share/abc')).toBeTruthy();
  });

  it('says so where the server will not hand out a link', async () => {
    jest.mocked(createShare).mockResolvedValue(null);
    const drawn = await render(
      <AShareSheet subject={{ kind: 'book', book: aBook() }} onClose={jest.fn()} />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByText('Make a link'));

    expect(await drawn.findByText(/could not be shared/u)).toBeTruthy();
  });

  it('asks whether to share an episode alone or its whole programme', async () => {
    await render(
      <AShareSheet
        subject={{
          kind: 'item',
          media: { id: 'e1', title: 'Hell', seriesId: 'severance', seriesTitle: 'Severance' },
        }}
        onClose={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(theChoicesIn('What to share')).toContain('The whole programme');
  });
});
