import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { MissingSongDialog } from './MissingSongDialog';

const go = vi.hoisted(() => vi.fn());

vi.mock('@ValenceScreens/navigation/usePlace', () => ({
  usePlace: () => ({ place: {}, go }),
}));

const COASTAL = {
  kind: 'album' as const,
  id: '00000000-0000-4000-8000-00000000c0a5',
  title: 'Coastal',
  subtitle: 'Mara Quill',
  year: 2024,
  overview: null,
  posterUrl: null,
  standing: { status: 'askable' as const, mediaId: null, requestId: null, requestState: null },
};

const SONG = { title: 'Low Tide', artist: 'Mara Quill', album: 'Coastal', releaseId: null };

beforeEach(() => {
  go.mockReset();
});

describe('MissingSongDialog', () => {
  it('looks for the album by its artist and name, and opens the page for asking for one chosen', async () => {
    const fetched = answerMusicRequests({ '/api/requests/catalogue/search': [COASTAL] });
    const onClose = vi.fn();

    vi.stubGlobal('fetch', fetched);
    renderInAnAddress(<MissingSongDialog song={SONG} onClose={onClose} />);

    expect(
      screen.getByText(
        'Low Tide by Mara Quill isn’t in your library. Choose the album it’s on to request it.',
      ),
    ).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: /Coastal/u }));

    expect(fetched).toHaveBeenCalledWith(
      expect.stringContaining('query=Mara+Quill+Coastal&kind=album'),
      expect.anything(),
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(go).toHaveBeenCalledWith({ asking: `album:${COASTAL.id}` });
  });

  it('looks by the song itself where the playlist does not say its album, and says when nothing is found', async () => {
    const fetched = answerMusicRequests({ '/api/requests/catalogue/search': [] });

    vi.stubGlobal('fetch', fetched);
    renderInAnAddress(<MissingSongDialog song={{ ...SONG, album: null }} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('No album was found for it in the catalogue.')).toBeInTheDocument();
    });
    expect(fetched).toHaveBeenCalledWith(
      expect.stringContaining('query=Mara+Quill+Low+Tide&kind=album'),
      expect.anything(),
    );
  });
});
