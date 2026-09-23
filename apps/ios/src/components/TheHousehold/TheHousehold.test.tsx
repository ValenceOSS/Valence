import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchSession } from '@ValenceClient/session/auth';
import { fetchLibraries, fetchLibraryItems } from '@ValenceClient/library/fetchLibrary';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { TheHousehold } from './TheHousehold';
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
  jest.mocked(fetchSession).mockReset();
  jest.mocked(fetchLibraries).mockReset().mockResolvedValue([]);
  jest.mocked(fetchLibraryItems).mockReset().mockResolvedValue({ items: [], total: 0 });
  globalThis.fetch = jest
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ profiles: [], splashscreen: null })));
});

afterEach(() => {
  forgetPlatform();
});

describe('TheHousehold', () => {
  it('shows the way in where nobody is signed in', async () => {
    jest.mocked(fetchSession).mockResolvedValue(null);

    const drawn = await render(around(<TheHousehold onElsewhere={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByText('Who is watching?')).toBeTruthy();
    });
  });

  it('shows what is behind it where somebody is', async () => {
    jest.mocked(fetchSession).mockResolvedValue(A_SESSION);

    const drawn = await render(around(<TheHousehold onElsewhere={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('What to show')).toBeTruthy();
    });
  });

  it('asks the server rather than remembering, so a session ended elsewhere shows the faces', async () => {
    jest.mocked(fetchSession).mockResolvedValue(null);

    const drawn = await render(around(<TheHousehold onElsewhere={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.queryByLabelText('What to show')).toBeNull();
      expect(drawn.getByText('Who is watching?')).toBeTruthy();
    });
  });
});
