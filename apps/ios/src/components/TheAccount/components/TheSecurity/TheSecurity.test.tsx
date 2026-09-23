import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchSession, listPasskeys } from '@ValenceClient/session/auth';
import { aSessionUser } from '@ValencePhone/testing/aSessionUser';
import { TheSecurity } from './TheSecurity';

jest.mock('@ValenceClient/session/auth', () => ({
  ...jest.requireActual<object>('@ValenceClient/session/auth'),
  fetchSession: jest.fn(),
  listPasskeys: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchSession).mockResolvedValue(aSessionUser());
  jest.mocked(listPasskeys).mockResolvedValue([]);
});

describe('TheSecurity', () => {
  it('offers two-step sign in, and says where to add a passkey', async () => {
    const drawn = await render(<TheSecurity />, { wrapper: CacheScope });

    expect(await drawn.findByText('Two-step sign in')).toBeTruthy();
    expect(
      await drawn.findByText('No passkeys yet. Add one from Valence on the web.'),
    ).toBeTruthy();
  });
});
