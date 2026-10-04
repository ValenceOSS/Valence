import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FulfilmentFields } from './FulfilmentFields';

const fetchArrAppChoicesMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchArrApps', () => ({
  fetchArrAppChoices: fetchArrAppChoicesMock,
  fetchArrApps: vi.fn(),
  fetchArrQueue: vi.fn(),
}));

const FORM = {
  appId: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
  rootFolderPath: '',
  qualityProfileId: '',
  metadataProfileId: '',
  searchesOnAdd: true,
};

/**
 * Draws the fields in a cache that gives up at once.
 */
const draw = (form = FORM) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <FulfilmentFields kind="radarr" apps={[]} form={form} onChange={vi.fn()} />
    </QueryClientProvider>,
  );

describe('FulfilmentFields', () => {
  it('says while the app’s choices are read, and where they could not be', async () => {
    fetchArrAppChoicesMock.mockRejectedValue(new Error('No'));

    draw();

    expect(screen.getByLabelText('Loading the app’s folders and profiles…')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Couldn’t load the app’s folders and profiles.',
    );
  });

  it('asks nothing of any app while Valence fulfils the library', () => {
    fetchArrAppChoicesMock.mockClear();

    draw({ ...FORM, appId: 'valence' });

    expect(screen.queryByText(/Root folder/)).not.toBeInTheDocument();
    expect(fetchArrAppChoicesMock).not.toHaveBeenCalled();
  });
});
