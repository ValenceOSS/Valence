import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { TheRequests } from './TheRequests';
import type { ReactNode } from 'react';
import { theAddressOf } from '@ValencePhone/testing/theAddressOf';

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  globalThis.fetch = jest.fn((input: RequestInfo | URL) =>
    Promise.resolve(
      theAddressOf(input).includes('/catalogue/search')
        ? Response.json([aCatalogueTitle({ title: 'Arrival', id: '329865' })])
        : theAddressOf(input).endsWith('/api/requests/media')
          ? Response.json([])
          : Response.json({
              shelves: [
                {
                  id: 'trending',
                  title: 'Trending films',
                  titles: [aCatalogueTitle()],
                  browse: null,
                },
              ],
              studios: [],
            }),
    ),
  );
});

describe('TheRequests', () => {
  it('opens on what there is to discover', async () => {
    const drawn = await render(around(<TheRequests onAsk={jest.fn()} />));

    expect(await drawn.findByText('Trending films')).toBeTruthy();
  });

  it('shows what has been asked for', async () => {
    const drawn = await render(around(<TheRequests onAsk={jest.fn()} />));

    await userEvent.press(drawn.getByRole('button', { name: 'Requested' }));

    expect(await drawn.findByText('Nothing asked for yet.')).toBeTruthy();
  });

  it('searches the catalogue for what was typed', async () => {
    jest.useFakeTimers();

    const drawn = await render(around(<TheRequests onAsk={jest.fn()} />));

    await userEvent.type(drawn.getByLabelText('Search for something new'), 'arrival');
    jest.advanceTimersByTime(500);
    jest.useRealTimers();

    await waitFor(() => {
      expect(drawn.getAllByRole('button', { name: 'Arrival' }).length).toBeGreaterThan(0);
    });
  });
});
