import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { fetchSession, signOut } from '@ValenceClient/session/auth';
import { fetchLibraries, fetchLibraryItems } from '@ValenceClient/library/fetchLibrary';
import { SignedIn } from './SignedIn';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/session/auth');
jest.mock('@ValenceClient/library/fetchLibrary');

const A_SESSION = {
  id: 'MllMpJgdqC9rKsdlZjN23KwuRYubAfQF',
  name: 'Dan',
  email: 'dan@getvalence.app',
  emailVerified: true,
};

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  jest.mocked(signOut).mockReset().mockResolvedValue(true);
  jest.mocked(fetchSession).mockReset().mockResolvedValue(A_SESSION);
  jest.mocked(fetchLibraries).mockReset().mockResolvedValue([]);
  jest.mocked(fetchLibraryItems).mockReset().mockResolvedValue({ items: [], total: 0 });
});

afterEach(() => {
  forgetPlatform();
});

describe('SignedIn', () => {
  it('shows the library once there is a session to read it with', async () => {
    const drawn = await render(around(<SignedIn onOut={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByText('Library')).toBeTruthy();
    });
  });

  it('asks nothing of the library before the session has answered', async () => {
    jest.mocked(fetchSession).mockReturnValue(new Promise(() => undefined));

    await render(around(<SignedIn onOut={jest.fn()} />));

    expect(fetchLibraries).not.toHaveBeenCalled();
  });

  it('signs out and says so', async () => {
    const onOut = jest.fn();
    const drawn = await render(around(<SignedIn onOut={onOut} />));

    await waitFor(() => {
      expect(drawn.getByText('Sign out')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Sign out'));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(onOut).toHaveBeenCalled();
    });
  });
});
