import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { TheLiveTv } from './TheLiveTv';

jest.mock('@ValenceClient/query/readFromServer', () => ({ readFromServer: jest.fn() }));

/**
 * A channel the guide carries, numbered by where it stands.
 *
 * @param at - Where it stands.
 * @returns The channel.
 */
const aChannel = (at: number) => ({
  id: `3fa85f64-5717-4562-b3fc-${at.toString().padStart(12, '0')}`,
  sourceId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  number: at.toString(),
  name: `Channel ${at.toString()}`,
  group: null,
  region: null,
  health: 'onAir' as const,
  checkedAt: null,
  hasLogo: false,
  isFavourite: false,
  isEmbedded: false,
});

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheLiveTv', () => {
  it('draws the first channels of a long list rather than every one of them', async () => {
    jest.mocked(readFromServer).mockResolvedValue({
      hasProxy: false,
      channels: Array.from({ length: 500 }, (_, at) => aChannel(at + 1)),
      programmes: [],
    });

    const drawn = await render(<TheLiveTv header={null} />, { wrapper: CacheScope });

    expect(await drawn.findByText('1 · Channel 1')).toBeTruthy();
    expect(drawn.queryByText('500 · Channel 500')).toBeNull();
  });
});
