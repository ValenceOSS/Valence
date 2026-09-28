import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { PluginMedia } from '@ValenceTv/components/PluginSurface/components/PluginMedia/PluginMedia';

const FILM = '00000000-0000-4000-8000-000000000001';

const detail = MediaDetailSchema.parse({
  id: FILM,
  libraryId: '00000000-0000-4000-8000-0000000000aa',
  title: 'Arrival',
  year: 2016,
  container: 'mkv',
  durationSeconds: 6960,
  videoCodec: 'h264',
  videoRange: 'SDR',
  width: 1920,
  height: 1080,
  bitrateKbps: 8000,
  audioStreams: [{ index: 1, codec: 'aac', channels: 6, isAtmos: false }],
  subtitleStreams: [],
  addedAt: '2026-09-19T00:00:00.000Z',
  metadata: { hasPoster: true, hasBackdrop: false, hasLogo: false },
});

describe('PluginMedia', () => {
  it('draws the title from the library’s own record', async () => {
    const cache = new QueryClient();

    cache.setQueryData(libraryQueries.detail(FILM).queryKey, detail);

    const drawn = await render(
      <QueryClientProvider client={cache}>
        <PluginMedia mediaId={FILM} />
      </QueryClientProvider>,
    );

    expect(drawn.getByLabelText(/Arrival/u)).toBeTruthy();
  });

  it('draws nothing until the library has answered', async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { enabled: false } } });
    const drawn = await render(
      <QueryClientProvider client={cache}>
        <PluginMedia mediaId={FILM} />
      </QueryClientProvider>,
    );

    expect(drawn.toJSON()).toBeNull();
  });
});
