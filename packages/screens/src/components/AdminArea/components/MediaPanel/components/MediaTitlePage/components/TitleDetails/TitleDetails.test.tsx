import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { TitleDetails } from './TitleDetails';

const { read, values } = vi.hoisted(() => ({ read: vi.fn(), values: vi.fn() }));

vi.mock('@ValenceClient/admin/fetchTitleMetadata', () => ({
  fetchTitleMetadata: read,
  editTitleMetadata: vi.fn(),
  undoTitleChange: vi.fn(),
  fetchTitleHistory: vi.fn(),
}));
vi.mock('@ValenceClient/admin/fetchTitleValues', () => ({ fetchTitleValues: values }));

describe('TitleDetails', () => {
  it('lays a film’s fields out in sections, with its TMDB id and Fix match beside it', async () => {
    read.mockResolvedValue({
      subject: { kind: 'film', key: 'movie:603', libraryId: 'lib', isMatched: true },
      fields: {
        title: { value: 'A film', source: 'catalogue', catalogue: 'A film' },
        imdbId: { value: 'tt0133093', source: 'catalogue', catalogue: 'tt0133093' },
      },
      certificationRegion: 'GB',
    });
    values.mockResolvedValue({ values: [] });

    render(<TitleDetails mediaId="a" scope="title" onFixMatch={vi.fn()} />, {
      wrapper: CacheScope,
    });

    expect(await screen.findByRole('heading', { name: 'Title and release' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('A film');
    expect(screen.getByText('603')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fix match' })).toBeInTheDocument();
  });

  it('shows a season only the fields a season has', async () => {
    read.mockResolvedValue({
      subject: { kind: 'season', key: 'tv:1:s1', libraryId: 'lib', isMatched: true },
      fields: { title: { value: 'Season 1', source: 'catalogue', catalogue: 'Season 1' } },
    });

    render(<TitleDetails mediaId="a" scope="season" />, { wrapper: CacheScope });

    expect(await screen.findByLabelText('Name')).toHaveValue('Season 1');
    expect(screen.queryByText('Classification')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fix match' })).not.toBeInTheDocument();
  });

  it('says when the details could not be read', async () => {
    read.mockRejectedValue(new Error('down'));

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <TitleDetails mediaId="a" scope="title" />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText(/Couldn’t read this title’s details\. down/u),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitleDetails.displayName).toBe('TitleDetails');
  });
});
