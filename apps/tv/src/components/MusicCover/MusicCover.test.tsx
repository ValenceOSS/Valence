import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { z } from 'zod';
import { MusicCover } from '@ValenceTv/components/MusicCover/MusicCover';

const mockTraced = (name: string) => <Text>{name}</Text>;

jest.mock('@keyline-icons/react-native', () => ({
  ...jest.requireActual<object>('@keyline-icons/react-native'),
  MusicNote: () => mockTraced('note'),
  Sparkles: () => mockTraced('sparkles'),
}));

const SourceSchema = z.array(z.object({ uri: z.string() }));

type Drawn = Awaited<ReturnType<typeof render>>;

const pictureNodesIn = (drawn: Drawn) =>
  drawn.root?.queryAll((node) => node.type === 'ViewManagerAdapter_ExpoImage') ?? [];

const picturesIn = (drawn: Drawn): string[] =>
  pictureNodesIn(drawn).flatMap((node) =>
    SourceSchema.parse(node.props.source).map((source) => source.uri),
  );

describe('MusicCover', () => {
  it('shows the cover it is given', async () => {
    const drawn = await render(
      <MusicCover kind="album" art="/api/music/albums/1/artwork" size={260} />,
    );

    expect(picturesIn(drawn)).toEqual(['/api/music/albums/1/artwork']);
  });

  it('shows a quiet note where there is no cover', async () => {
    const drawn = await render(<MusicCover kind="album" art={null} size={260} />);

    expect(picturesIn(drawn)).toEqual([]);
  });

  it('gives up the cover for the note once it will not load', async () => {
    const drawn = await render(
      <MusicCover kind="album" art="/api/music/albums/1/artwork" size={260} />,
    );
    const [cover] = pictureNodesIn(drawn);

    expect(pictureNodesIn(drawn)).toHaveLength(1);

    if (cover !== undefined) {
      await fireEvent(cover, 'error', { nativeEvent: { error: 'Not found' } });
    }

    expect(picturesIn(drawn)).toEqual([]);
  });

  it('draws an artist round', async () => {
    const drawn = await render(
      <MusicCover kind="artist" art="/api/music/artists/1/image" size={200} />,
    );

    expect(drawn.root).toHaveStyle({ width: 200, height: 200, borderRadius: 100 });
  });

  it('draws liked songs as a heart on violet rather than any cover', async () => {
    const drawn = await render(
      <MusicCover kind="liked" art="/api/music/albums/1/artwork" size={200} />,
    );

    expect(picturesIn(drawn)).toEqual([]);
    expect(drawn.root).toHaveStyle({ backgroundColor: '#4f3bd9' });
  });

  it('draws sparkles for a mix Valence made with no cover, and a note for anything else', async () => {
    const mix = await render(<MusicCover kind="mix" art={null} size={200} />);

    expect(mix.getByText('sparkles')).toBeTruthy();
    expect(mix.queryByText('note')).toBeNull();

    const album = await render(<MusicCover kind="album" art={null} size={200} />);

    expect(album.getByText('note')).toBeTruthy();
  });
});
