import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArtworkChooser } from './ArtworkChooser';
import type { ReactNode } from 'react';

Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: () => 'blob:chosen',
});
Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => undefined });

const fetchArtworkChoicesMock = vi.hoisted(() => vi.fn());
const chooseArtworkMock = vi.hoisted(() => vi.fn());
const bumpMock = vi.hoisted(() => vi.fn());
const uploadArtworkMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/fetchArtworkChoices', () => ({
  fetchArtworkChoices: fetchArtworkChoicesMock,
}));
vi.mock('@ValenceClient/library/chooseArtwork', () => ({ chooseArtwork: chooseArtworkMock }));
vi.mock('@ValenceClient/library/uploadArtwork', () => ({ uploadArtwork: uploadArtworkMock }));
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
  onDisk: [{ url: 'valence-disk:cG9zdGVyLmpwZw', name: 'poster.jpg' }],
  chosen: { poster: `${BASE}/original/ja.jpg`, backdrop: null, logo: null },
  defaults: { poster: `${BASE}/w342/own.jpg`, backdrop: null, logo: null },
};

const SUBJECT = {
  mediaId: 'ep-1',
  name: 'A show',
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
  uploadArtworkMock.mockReset().mockResolvedValue({ jobId: null });
});

describe('ArtworkChooser', () => {
  it('offers the catalogue’s posters, with the one chosen marked', async () => {
    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={vi.fn()} />);

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

  it('shows the picture the catalogue picks on the tile that goes back to it', async () => {
    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={vi.fn()} />);

    const own = await screen.findByRole('button', { name: 'Use the default poster' });

    expect(own.querySelector('img')).toHaveAttribute('src', `${BASE}/w342/own.jpg`);
    expect(own).toHaveTextContent('Catalogue default');
  });

  it('chooses a picture for every episode and asks for it anew', async () => {
    const onChanged = vi.fn();

    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={onChanged} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Use poster 1, English' }));

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith(null);
    });
    expect(chooseArtworkMock).toHaveBeenCalledWith(
      'ep-1',
      'poster',
      `${BASE}/original/en.jpg`,
      undefined,
    );
    expect(bumpMock).toHaveBeenCalledWith(['ep-1', 'ep-1', 'ep-2']);
  });

  it('goes back to the catalogue’s pick', async () => {
    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Use the default poster' }));

    await waitFor(() => {
      expect(chooseArtworkMock).toHaveBeenCalledWith('ep-1', 'poster', null, undefined);
    });
  });

  it('shows the logos when asked, labelled by whether they carry lettering', async () => {
    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={vi.fn()} />);

    await screen.findByRole('button', { name: 'Use poster 1, English' });
    await userEvent.click(screen.getByRole('button', { name: 'Logo' }));

    expect(screen.getByRole('button', { name: 'Use logo 1, No text' })).toBeInTheDocument();
  });

  it('says there is nothing of a kind, rather than showing an empty grid', async () => {
    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={vi.fn()} />);

    await screen.findByRole('button', { name: 'Use poster 1, English' });
    await userEvent.click(screen.getByRole('button', { name: 'Backdrop' }));

    expect(screen.getByText('No backdrops are available for this title.')).toBeInTheDocument();
  });

  it('passes on why nothing could be offered', async () => {
    fetchArtworkChoicesMock.mockResolvedValue({
      problem: 'This isn’t matched to the catalogue yet. Fix the match first.',
    });

    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={vi.fn()} />);

    expect(
      await screen.findByText('This isn’t matched to the catalogue yet. Fix the match first.'),
    ).toBeInTheDocument();
  });
  it('says which picture is in use, and goes back to the catalogue’s pick in one press', async () => {
    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={vi.fn()} />);

    expect(await screen.findByText('In use: one chosen from the catalogue')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Go back to the catalogue’s pick' }));

    await waitFor(() => {
      expect(chooseArtworkMock).toHaveBeenCalledWith('ep-1', 'poster', null, undefined);
    });
  });

  it('shows the picture in use beside the catalogue’s pick', async () => {
    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={vi.fn()} />);

    const inUse = await screen.findByRole('button', {
      name: 'In use: one chosen from the catalogue',
    });

    expect(inUse.querySelector('img')).toHaveAttribute('src', `${BASE}/w342/ja.jpg`);
  });

  it('offers the pictures beside the title’s files, drawn through the server', async () => {
    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={vi.fn()} />);

    const onDisk = await screen.findByRole('button', { name: 'Use poster.jpg from the disk' });

    expect(onDisk.querySelector('img')).toHaveAttribute(
      'src',
      '/api/media/ep-1/artwork/picture?url=valence-disk%3AcG9zdGVyLmpwZw',
    );

    await userEvent.click(onDisk);

    await waitFor(() => {
      expect(chooseArtworkMock).toHaveBeenCalledWith(
        'ep-1',
        'poster',
        'valence-disk:cG9zdGVyLmpwZw',
        undefined,
      );
    });
  });

  it('shows each picture’s size and votes, and puts the ones with no lettering first when asked', async () => {
    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={vi.fn()} />);

    expect((await screen.findAllByText('1000 × 1500 · 2 votes')).length).toBeGreaterThan(0);
  });

  it('says which pictures come from fanart.tv', async () => {
    fetchArtworkChoicesMock.mockResolvedValue({
      ...CHOICES,
      options: {
        ...CHOICES.options,
        poster: [{ ...option('/fan.jpg', null), source: 'fanart' }],
      },
    });
    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={vi.fn()} />);

    expect(await screen.findByText('1000 × 1500 · From fanart.tv')).toBeInTheDocument();
  });

  it('uploads a picture for the kind shown and uses it', async () => {
    const onChanged = vi.fn();
    const picture = new File(['x'], 'mine.png', { type: 'image/png' });

    inAQueryClient(<ArtworkChooser subject={SUBJECT} onChanged={onChanged} />);

    await screen.findByRole('button', { name: 'Use poster 1, English' });
    await userEvent.click(screen.getByRole('button', { name: 'Backdrop' }));
    await userEvent.upload(await screen.findByLabelText(/Upload from this computer/u), picture);
    await userEvent.click(await screen.findByRole('button', { name: 'Use this picture' }));

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith(null);
    });
    expect(uploadArtworkMock).toHaveBeenCalledWith('ep-1', 'backdrop', picture, {
      zoom: 1,
      x: 0,
      y: 0,
    });
  });
});
