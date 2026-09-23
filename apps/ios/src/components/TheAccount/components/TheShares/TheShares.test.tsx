import { act, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { Alert } from 'react-native';
import { fetchShares, revokeShare } from '@ValenceClient/sharing/fetchShares';
import { TheShares } from './TheShares';

jest.mock('@ValenceClient/sharing/fetchShares', () => ({
  ...jest.requireActual<object>('@ValenceClient/sharing/fetchShares'),
  fetchShares: jest.fn(),
  revokeShare: jest.fn(),
}));

const aShare = (overrides: object = {}) => ({
  id: '00000000-0000-4000-8000-00000000005a',
  kind: 'item' as const,
  mediaId: '00000000-0000-4000-8000-00000000005b',
  seriesId: null,
  bookId: null,
  title: 'Arrival',
  createdAt: '2026-09-23T10:00:00.000Z',
  expiresAt: null,
  viewCap: null,
  views: 2,
  isRevoked: false,
  isSpent: false,
  ...overrides,
});

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheShares', () => {
  it('lists the links handed out, and withdraws a live one once asked', async () => {
    jest.mocked(fetchShares).mockResolvedValue([aShare()]);
    jest.mocked(revokeShare).mockResolvedValue(true);
    const asking = jest.spyOn(Alert, 'alert');
    const drawn = await render(<TheShares />, { wrapper: CacheScope });

    expect(await drawn.findByText('Arrival')).toBeTruthy();
    expect(drawn.getByText('Live · Opened 2 times · Until it is withdrawn')).toBeTruthy();

    await userEvent.press(drawn.getByText('Withdraw'));
    await act(() => {
      asking.mock.calls
        .at(-1)?.[2]
        ?.find((button) => button.text === 'Withdraw')
        ?.onPress?.();
    });

    expect(revokeShare).toHaveBeenCalledWith(aShare().id);
  });

  it('offers no way to withdraw a link that has already been', async () => {
    jest.mocked(fetchShares).mockResolvedValue([aShare({ isRevoked: true })]);
    const drawn = await render(<TheShares />, { wrapper: CacheScope });

    expect(await drawn.findByText(/Withdrawn/u)).toBeTruthy();
    expect(drawn.queryByText('Withdraw')).toBeNull();
  });
});
