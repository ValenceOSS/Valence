import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { z } from 'zod';
import { MediaCard } from '@ValenceTv/components/MediaCard/MediaCard';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const FILM: MediaSummary = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-000000000002',
  title: 'Dune',
  year: 2021,
  durationSeconds: 9000,
  width: 3840,
  height: 2160,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-09-23T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
};

const SourceSchema = z.array(z.object({ uri: z.string() }));

type Drawn = Awaited<ReturnType<typeof render>>;

const picturesIn = (drawn: Drawn): string[] =>
  (drawn.root?.queryAll((node) => node.type === 'ViewManagerAdapter_ExpoImage') ?? []).flatMap(
    (node) => SourceSchema.parse(node.props.source).map((source) => source.uri),
  );

describe('MediaCard', () => {
  it('is named for the title and hands it back when chosen', async () => {
    const onPress = jest.fn();
    const drawn = await render(<MediaCard media={FILM} onPress={onPress} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Dune' }));

    expect(onPress).toHaveBeenCalledWith(FILM);
  });

  it('says which title the remote has landed on', async () => {
    const onFocus = jest.fn();
    const drawn = await render(<MediaCard media={FILM} onPress={jest.fn()} onFocus={onFocus} />);

    await fireEvent(drawn.getByRole('button', { name: 'Dune' }), 'focus');

    expect(onFocus).toHaveBeenCalledWith(FILM);
  });

  it('names a title only while the remote is on it', async () => {
    const drawn = await render(<MediaCard media={FILM} onPress={jest.fn()} />);

    expect(drawn.getByText('Dune')).toHaveStyle({ opacity: 0 });

    await fireEvent(drawn.getByRole('button', { name: 'Dune' }), 'focus');

    expect(drawn.getByText('Dune')).not.toHaveStyle({ opacity: 0 });

    await fireEvent(drawn.getByRole('button', { name: 'Dune' }), 'blur');

    expect(drawn.getByText('Dune')).toHaveStyle({ opacity: 0 });
  });

  it('shows a backdrop on a wide card and a poster on a tall one', async () => {
    const wide = await render(<MediaCard media={FILM} onPress={jest.fn()} />);

    expect(picturesIn(wide)).toEqual([`/api/media/${FILM.id}/image/backdrop`]);

    const tall = await render(<MediaCard media={FILM} shape="poster" onPress={jest.fn()} />);

    expect(picturesIn(tall)).toEqual([`/api/media/${FILM.id}/image/poster`]);
  });

  it('falls back to whichever picture a title has, and to none at all', async () => {
    const posterOnly = await render(
      <MediaCard media={{ ...FILM, hasBackdrop: false }} onPress={jest.fn()} />,
    );

    expect(picturesIn(posterOnly)).toEqual([`/api/media/${FILM.id}/image/poster`]);

    const neither = await render(
      <MediaCard media={{ ...FILM, hasBackdrop: false, hasPoster: false }} onPress={jest.fn()} />,
    );

    expect(picturesIn(neither)).toEqual([]);
  });

  it('letters a wide card with the logo and names it in words once the logo will not load', async () => {
    const drawn = await render(
      <MediaCard media={{ ...FILM, hasLogo: true }} onPress={jest.fn()} />,
    );

    expect(picturesIn(drawn)).toContain(`/api/media/${FILM.id}/image/logo?at=full`);

    await fireEvent(drawn.getByRole('button', { name: 'Dune' }), 'focus');

    expect(drawn.getByText('Dune')).toHaveStyle({ opacity: 0 });

    const [logo] =
      drawn.root?.queryAll(
        (node) =>
          node.type === 'ViewManagerAdapter_ExpoImage' &&
          SourceSchema.parse(node.props.source).some((source) => source.uri.includes('logo')),
      ) ?? [];

    if (logo !== undefined) {
      await fireEvent(logo, 'error', { nativeEvent: { error: 'Not found' } });
    }

    expect(picturesIn(drawn)).not.toContain(`/api/media/${FILM.id}/image/logo?at=full`);
    expect(drawn.getByText('Dune')).not.toHaveStyle({ opacity: 0 });
  });

  it('names an episode for its programme and says where it falls', async () => {
    const episode = {
      ...FILM,
      title: 'Pilot',
      seriesTitle: 'Severance',
      seasonNumber: 1,
      episodeNumber: 2,
    };
    const drawn = await render(<MediaCard media={episode} isEpisode onPress={jest.fn()} />);

    expect(drawn.getByRole('button', { name: 'Severance' })).toBeOnTheScreen();
    expect(drawn.getByText('Severance')).not.toHaveStyle({ opacity: 0 });
    expect(drawn.getByText('S1 · E2  Pilot')).toBeOnTheScreen();
  });

  it('says only the episode title where its place in the programme is unknown', async () => {
    const episode = { ...FILM, title: 'Pilot', seriesTitle: 'Severance' };
    const drawn = await render(<MediaCard media={episode} isEpisode onPress={jest.fn()} />);

    expect(drawn.getByText('Pilot')).toBeOnTheScreen();
  });
});
