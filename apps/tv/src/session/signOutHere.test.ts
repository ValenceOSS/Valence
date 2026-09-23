import { signOut } from '@ValenceClient/session/auth';
import { keepTheSessionToken, theSessionToken } from '@ValenceTv/platform/theSessionToken';
import { signOutHere } from '@ValenceTv/session/signOutHere';

const mockTokensAtSignOut: (string | null)[] = [];

jest.mock('@ValenceClient/session/auth', () => ({
  signOut: jest.fn(() => {
    mockTokensAtSignOut.push(
      jest
        .requireActual<{ theSessionToken: () => string | null }>(
          '@ValenceTv/platform/theSessionToken',
        )
        .theSessionToken(),
    );

    return Promise.resolve(true);
  }),
}));

beforeEach(() => {
  mockTokensAtSignOut.length = 0;
  jest.mocked(signOut).mockClear();
});

describe('signOutHere', () => {
  it('ends the token’s session, forgets the token, then ends the cookie’s', async () => {
    keepTheSessionToken('secret');

    await signOutHere();

    expect(mockTokensAtSignOut).toEqual(['secret', null]);
    expect(theSessionToken()).toBeNull();
  });

  it('forgets the token even where the server cannot be told', async () => {
    keepTheSessionToken('secret');
    jest.mocked(signOut).mockRejectedValue(new Error('offline'));

    await expect(signOutHere()).resolves.toBeUndefined();
    expect(signOut).toHaveBeenCalledTimes(2);
    expect(theSessionToken()).toBeNull();
  });
});
