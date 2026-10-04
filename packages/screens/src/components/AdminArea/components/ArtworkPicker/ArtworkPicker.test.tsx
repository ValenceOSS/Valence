import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArtworkPicker } from './ArtworkPicker';
import type { ReactNode } from 'react';

const fetchArtworkChoicesMock = vi.hoisted(() => vi.fn());
const chooseArtworkMock = vi.hoisted(() => vi.fn());
const bumpMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/fetchArtworkChoices', () => ({
  fetchArtworkChoices: fetchArtworkChoicesMock,
}));
vi.mock('@ValenceClient/library/chooseArtwork', () => ({ chooseArtwork: chooseArtworkMock }));
vi.mock('@ValenceClient/library/artworkRevisions', () => ({
  artworkRevisions: { bump: bumpMock, of: () => 0 },
}));

const BASE = 'https://image.tmdb.org/t/p';

const option = (path: string, language: string | null) => ({
  url: `${BASE}/original${path}`,
  previewUrl: `${BASE}/w342${path}`,
  language,
  width: 1000,
  height: 1500,
  votes: 2,
});

const CHOICES = {
  kind: 'tv',
  options: {
    poster: [option('/en.jpg', 'en'), option('/ja.jpg', 'ja')],
    backdrop: [],
    logo: [option('/logo.png', null)],
  },
  chosen: { poster: `${BASE}/original/ja.jpg`, backdrop: null, logo: null },
};

const SUBJECT = {
  mediaId: 'ep-1',
  name: 'The Dangers in My Heart',
  isSeries: true,
  mediaIds: ['ep-1', 'ep-2'],
};

const inAQueryClient = (element: ReactNode) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {element}
    </QueryClientProvider>,
  );

beforeEach(() => {
  fetchArtworkChoicesMock.mockReset().mockResolvedValue(CHOICES);
  chooseArtworkMock.mockReset().mockResolvedValue({ jobId: null });
  bumpMock.mockReset();
});

describe('ArtworkPicker', () => {
  it('offers the catalogue’s posters, with the one chosen marked', async () => {
    inAQueryClient(<ArtworkPicker subject={SUBJECT} onClose={vi.fn()} onChanged={vi.fn()} />);

    expect(
      await screen.findByRole('button', { name: 'Use poster 1, English' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use poster 2, Japanese' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Use the default poster' })).not.toHaveAttribute(
      'aria-pressed',
    );
  });

  it('chooses a picture for every episode and asks for it anew', async () => {
    const onChanged = vi.fn();

    inAQueryClient(<ArtworkPicker subject={SUBJECT} onClose={vi.fn()} onChanged={onChanged} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Use poster 1, English' }));

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith(null);
    });
    expect(chooseArtworkMock).toHaveBeenCalledWith('ep-1', 'poster', `${BASE}/original/en.jpg`);
    expect(bumpMock).toHaveBeenCalledWith(['ep-1', 'ep-1', 'ep-2']);
  });

  it('goes back to the catalogue’s pick', async () => {
    inAQueryClient(<ArtworkPicker subject={SUBJECT} onClose={vi.fn()} onChanged={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Use the default poster' }));

    await waitFor(() => {
      expect(chooseArtworkMock).toHaveBeenCalledWith('ep-1', 'poster', null);
    });
  });

  it('shows the logos when asked, labelled by whether they carry lettering', async () => {
    inAQueryClient(<ArtworkPicker subject={SUBJECT} onClose={vi.fn()} onChanged={vi.fn()} />);

    await screen.findByRole('button', { name: 'Use poster 1, English' });
    await userEvent.click(screen.getByRole('button', { name: 'Logo' }));

    expect(screen.getByRole('button', { name: 'Use logo 1, No text' })).toBeInTheDocument();
  });

  it('says there is nothing of a kind, rather than showing an empty grid', async () => {
    inAQueryClient(<ArtworkPicker subject={SUBJECT} onClose={vi.fn()} onChanged={vi.fn()} />);

    await screen.findByRole('button', { name: 'Use poster 1, English' });
    await userEvent.click(screen.getByRole('button', { name: 'Backdrop' }));

    expect(screen.getByText('No backdrops are available for this title.')).toBeInTheDocument();
  });

  it('passes on why nothing could be offered', async () => {
    fetchArtworkChoicesMock.mockResolvedValue({
      problem: 'This isn’t matched to the catalogue yet. Fix the match first.',
    });

    inAQueryClient(<ArtworkPicker subject={SUBJECT} onClose={vi.fn()} onChanged={vi.fn()} />);

    expect(
      await screen.findByText('This isn’t matched to the catalogue yet. Fix the match first.'),
    ).toBeInTheDocument();
  });
});
