import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArtworkPicker } from './ArtworkPicker';

vi.mock('@ValenceClient/library/fetchArtworkChoices', () => ({
  fetchArtworkChoices: () => Promise.resolve({ problem: 'Nothing to offer.' }),
}));

const SUBJECT = { mediaId: 'ep-1', name: 'A show', isSeries: true, mediaIds: ['ep-1'] };

describe('ArtworkPicker', () => {
  it('opens on the title, saying a choice reaches every episode', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ArtworkPicker subject={SUBJECT} onClose={vi.fn()} onChanged={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText('A show').length).toBeGreaterThan(0);
    expect(await screen.findByText('Nothing to offer.')).toBeInTheDocument();
  });

  it('draws nothing while closed', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ArtworkPicker subject={null} onClose={vi.fn()} onChanged={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(screen.queryByText('Nothing to offer.')).not.toBeInTheDocument();
  });
});
