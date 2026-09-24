import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchSession } from '@ValenceClient/session/auth';
import { aSessionUser } from '@ValencePhone/testing/aSessionUser';
import { TheAccount } from './TheAccount';

jest.mock('@ValenceClient/session/auth', () => ({
  ...jest.requireActual<object>('@ValenceClient/session/auth'),
  fetchSession: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchSession).mockResolvedValue(aSessionUser());
});

describe('TheAccount', () => {
  it('says whose account it is, offers each part of it, and signs out', async () => {
    const onOut = jest.fn();
    const drawn = await render(<TheAccount onOut={onOut} onElsewhere={jest.fn()} />, { wrapper: CacheScope });

    expect(await drawn.findByText('dan@example.com')).toBeTruthy();
    expect(drawn.getByText('Shares')).toBeTruthy();

    await userEvent.press(drawn.getByText('Sign out'));

    expect(onOut).toHaveBeenCalled();
  });
});
