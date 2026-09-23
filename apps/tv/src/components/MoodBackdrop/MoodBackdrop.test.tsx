import { render } from '@testing-library/react-native';
import { z } from 'zod';
import { MoodBackdrop } from '@ValenceTv/components/MoodBackdrop/MoodBackdrop';

const SourceSchema = z.array(z.object({ uri: z.string() }));

type Drawn = Awaited<ReturnType<typeof render>>;

const picturesIn = (drawn: Drawn): string[] =>
  (drawn.root?.queryAll((node) => node.type === 'ViewManagerAdapter_ExpoImage') ?? []).flatMap(
    (node) => SourceSchema.parse(node.props.source).map((source) => source.uri),
  );

describe('MoodBackdrop', () => {
  it('lights the page with the picture showing', async () => {
    const drawn = await render(<MoodBackdrop path="/api/media/1/image/backdrop" />);

    expect(picturesIn(drawn)).toEqual(['/api/media/1/image/backdrop']);
  });

  it('keeps to the plain surface where there is no picture', async () => {
    const drawn = await render(<MoodBackdrop path={null} />);

    expect(picturesIn(drawn)).toEqual([]);
    expect(drawn.root).toBeOnTheScreen();
  });

  it('moves to the new picture as what is shown changes', async () => {
    const drawn = await render(<MoodBackdrop path="/api/media/1/image/backdrop" />);

    await drawn.rerender(<MoodBackdrop path="/api/media/2/image/backdrop" />);

    expect(picturesIn(drawn)).toEqual(['/api/media/2/image/backdrop']);
  });
});
