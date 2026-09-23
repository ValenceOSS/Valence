import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TheSeasons } from './TheSeasons';
import type { ReactNode } from 'react';

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  globalThis.fetch = jest.fn().mockResolvedValue(
    Response.json([
      { season: 1, episodeCount: 10, firstAired: '2011-04-17', standing: 'library' },
      { season: 2, episodeCount: 10, firstAired: '2012-04-01', standing: 'askable' },
    ]),
  );
});

describe('TheSeasons', () => {
  it('lists each season with what it holds and where it stands', async () => {
    const drawn = await render(
      around(<TheSeasons tmdbId={1399} seasons={null} onChange={jest.fn()} />),
    );

    expect(await drawn.findByText('10 episodes · 2011 · In the library')).toBeTruthy();
  });

  it('ticks every season where every season is asked for', async () => {
    const drawn = await render(
      around(<TheSeasons tmdbId={1399} seasons={null} onChange={jest.fn()} />),
    );

    expect(await drawn.findByRole('switch', { name: 'Season 2', checked: true })).toBeTruthy();
  });

  it('unticks one out of every season', async () => {
    const onChange = jest.fn();
    const drawn = await render(
      around(<TheSeasons tmdbId={1399} seasons={null} onChange={onChange} />),
    );

    await fireEvent(await drawn.findByRole('switch', { name: 'Season 1' }), 'valueChange', false);

    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it('takes none where every season is turned off', async () => {
    const onChange = jest.fn();
    const drawn = await render(
      around(<TheSeasons tmdbId={1399} seasons={null} onChange={onChange} />),
    );

    await fireEvent(
      await drawn.findByRole('switch', { name: 'Every season' }),
      'valueChange',
      false,
    );

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
