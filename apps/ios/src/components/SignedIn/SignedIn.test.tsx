import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchSession, signOut } from '@ValenceClient/session/auth';
import { SignedIn } from './SignedIn';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/session/auth');

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
  jest.mocked(signOut).mockReset().mockResolvedValue(true);
  jest.mocked(fetchSession).mockReset();
});

describe('SignedIn', () => {
  it('greets whoever is signed in', async () => {
    jest.mocked(fetchSession).mockResolvedValue(A_SESSION);

    const drawn = await render(around(<SignedIn onOut={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByText('Hello, Dan')).toBeTruthy();
    });
  });

  it('shows the account the session belongs to', async () => {
    jest.mocked(fetchSession).mockResolvedValue(A_SESSION);

    const drawn = await render(around(<SignedIn onOut={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByText('dan@getvalence.app')).toBeTruthy();
    });
  });

  it('signs out and says so', async () => {
    jest.mocked(fetchSession).mockResolvedValue(A_SESSION);

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
