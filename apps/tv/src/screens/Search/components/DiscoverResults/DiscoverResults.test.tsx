import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import { DiscoverResults } from './DiscoverResults';
import type { ReactNode } from 'react';

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const aTitle = (overrides: Partial<CatalogueTitle> = {}): CatalogueTitle => ({
  kind: 'film',
  id: '841',
  title: 'A Film',
  subtitle: null,
  year: 1984,
  overview: null,
  posterUrl: null,
  standing: { status: 'askable', mediaId: null, requestId: null, requestState: null },
  ...overrides,
});

describe('DiscoverResults', () => {
  it('shows a shelf of films and one of shows, and opens a title to ask for', async () => {
    const film = aTitle();
    const onAsk = jest.fn();
    const drawn = await render(
      around(
        <DiscoverResults
          asked="a"
          films={[film]}
          shows={[aTitle({ kind: 'series', id: '1', title: 'A Show' })]}
          onAsk={onAsk}
          onBack={jest.fn()}
        />,
      ),
    );

    expect(drawn.getByText('Results for “a”')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'A Show' })).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'A Film' }));

    expect(onAsk).toHaveBeenCalledWith(film);
  });

  it('goes back to what the library found', async () => {
    const onBack = jest.fn();
    const drawn = await render(
      <DiscoverResults asked="a" films={[]} shows={[]} onAsk={jest.fn()} onBack={onBack} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Back to library results' }));

    expect(onBack).toHaveBeenCalled();
  });
});
