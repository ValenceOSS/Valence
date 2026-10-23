import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaTab } from './MediaTab';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import type { MediaPanelProps } from '@ValenceScreens/components/AdminArea/components/MediaPanel/MediaPanel.types';

const drawn = vi.hoisted(() => {
  const props: MediaPanelProps[] = [];

  return { props };
});

vi.mock('@ValenceScreens/components/AdminArea/components/MediaPanel/MediaPanel', () => ({
  MediaPanel: (props: MediaPanelProps) => {
    drawn.props.push(props);

    return null;
  },
}));

const trickplay = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/playback/fetchTrickplay', () => ({ fetchTrickplay: trickplay }));

const notifyMock = vi.hoisted(() => ({ say: vi.fn(), worked: vi.fn(), failed: vi.fn() }));

vi.mock('@ValenceUI/notify', () => ({ notify: notifyMock }));

vi.mock('@ValenceClient/query/adminQueries', () => ({
  adminQueries: {
    key: ['admin'],
    albums: () => ({ queryKey: ['admin', 'albums'], queryFn: () => [] }),
    books: (ids: string[]) => ({ queryKey: ['admin', 'books', ids], queryFn: () => [] }),
    everyFile: (ids: string[]) => ({ queryKey: ['admin', 'everyFile', ids], queryFn: () => [] }),
    mediaPaths: (ids: string[]) => ({ queryKey: ['admin', 'paths', ids], queryFn: () => ({}) }),
  },
}));

vi.mock('@ValenceClient/query/libraryQueries', () => ({
  libraryQueries: {
    key: ['library'],
    all: () => ({ queryKey: ['library', 'all'], queryFn: () => [] }),
  },
}));

const LIBRARIES = [aLibrary()];

const HANDLERS = {
  onCorrect: vi.fn(),
  onChooseArtwork: vi.fn(),
  onCorrectAlbum: vi.fn(),
  onCorrectBook: vi.fn(),
  onChooseMoment: vi.fn(),
  onReencode: vi.fn(),
  onShowCopies: vi.fn(),
};

const ITEM = aMediaSummary();

beforeEach(() => {
  drawn.props.length = 0;
  trickplay.mockReset();
  notifyMock.say.mockReset();
  HANDLERS.onChooseMoment.mockReset();
});

/**
 * Draws the tab with a cache of its own.
 */
const draw = (cache = new QueryClient()) => (
  <QueryClientProvider client={cache}>
    <MediaTab libraries={LIBRARIES} mayDelete {...HANDLERS} />
  </QueryClientProvider>
);

describe('MediaTab', () => {
  it('is not drawn again when the admin area around it is and nothing it holds has changed', async () => {
    const cache = new QueryClient();
    const shown = render(draw(cache));

    await waitFor(() => {
      expect(drawn.props.at(-1)?.stillReading?.files).toBe(false);
    });

    const times = drawn.props.length;

    shown.rerender(draw(cache));
    shown.rerender(draw(cache));

    expect(drawn.props).toHaveLength(times);
  });

  it('opens the moment chooser only for a title whose previews exist', async () => {
    trickplay.mockResolvedValueOnce(null).mockResolvedValueOnce({ count: 1 });

    render(draw());

    const panel = drawn.props.at(-1);

    panel?.onChooseMoment(ITEM);

    await waitFor(() => {
      expect(notifyMock.say).toHaveBeenCalled();
    });

    expect(HANDLERS.onChooseMoment).not.toHaveBeenCalled();

    panel?.onChooseMoment(ITEM);

    await waitFor(() => {
      expect(HANDLERS.onChooseMoment).toHaveBeenCalledWith(ITEM);
    });
  });

  it('offers no delete or move to whoever may not delete media', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MediaTab libraries={LIBRARIES} mayDelete={false} {...HANDLERS} />
      </QueryClientProvider>,
    );

    expect(drawn.props.at(-1)?.onDelete).toBeUndefined();
    expect(drawn.props.at(-1)?.onMoved).toBeUndefined();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MediaTab.displayName).toBe('MediaTab');
  });
});
