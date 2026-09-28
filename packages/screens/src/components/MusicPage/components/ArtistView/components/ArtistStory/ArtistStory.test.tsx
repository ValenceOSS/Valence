import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { ArtistStory } from './ArtistStory';

const mayRequest = vi.hoisted(() => ({ value: true }));

vi.mock('@ValenceClient/requests/useMayRequest', () => ({
  useMayRequest: () => mayRequest.value,
}));

const ARTIST_ID = '00000000-0000-4000-8000-00000000a7a7';

const MISSING = {
  releaseGroupId: '00000000-0000-4000-8000-00000000b1b1',
  title: 'Take Me Back to Eden',
  type: 'album' as const,
  year: 2023,
  coverUrl: 'https://covers.example/eden.jpg',
};

const answer = (story: {
  bio: string | null;
  sourceUrl: string | null;
  missing: (typeof MISSING)[];
}) => {
  vi.stubGlobal('fetch', answerMusicRequests({ [`/api/music/artists/${ARTIST_ID}/story`]: story }));
};

beforeEach(() => {
  mayRequest.value = true;
});

describe('ArtistStory', () => {
  it('says who they are, and where that came from', async () => {
    answer({
      bio: 'A masked band from London.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Sleep_Token',
      missing: [],
    });

    renderInAnAddress(<ArtistStory artistId={ARTIST_ID} name="Sleep Token" />);

    expect(await screen.findByRole('region', { name: 'About Sleep Token' })).toBeInTheDocument();
    expect(screen.getByText('A masked band from London.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'From Wikipedia' })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Sleep_Token',
    );
  });

  it('offers the albums the library does not have to whoever may ask for them', async () => {
    answer({ bio: null, sourceUrl: null, missing: [MISSING] });

    renderInAnAddress(<ArtistStory artistId={ARTIST_ID} name="Sleep Token" />);

    expect(await screen.findByText('More from Sleep Token')).toBeInTheDocument();
    expect(screen.getByText('Take Me Back to Eden')).toBeInTheDocument();
    expect(screen.getByText('2023 · Album · Not in your library')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'About Sleep Token' })).not.toBeInTheDocument();
  });

  it('keeps the missing albums from anybody who may not ask for music', async () => {
    mayRequest.value = false;
    answer({ bio: 'A masked band from London.', sourceUrl: null, missing: [MISSING] });

    renderInAnAddress(<ArtistStory artistId={ARTIST_ID} name="Sleep Token" />);

    expect(await screen.findByText('A masked band from London.')).toBeInTheDocument();
    expect(screen.queryByText('More from Sleep Token')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'From Wikipedia' })).not.toBeInTheDocument();
  });

  it('draws nothing where nothing is known', async () => {
    const requests = answerMusicRequests();

    vi.stubGlobal('fetch', requests);

    const { container } = renderInAnAddress(
      <ArtistStory artistId={ARTIST_ID} name="Sleep Token" />,
    );

    await waitFor(() => {
      expect(requests).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });
});
