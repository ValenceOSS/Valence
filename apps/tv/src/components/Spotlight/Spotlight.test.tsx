import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { z } from 'zod';
import { Spotlight } from '@ValenceTv/components/Spotlight/Spotlight';

const SourceSchema = z.array(z.object({ uri: z.string() }));

type Drawn = Awaited<ReturnType<typeof render>>;

const picturesIn = (drawn: Drawn) =>
  (drawn.root?.queryAll((node) => node.type === 'ViewManagerAdapter_ExpoImage') ?? []).map(
    (node) => SourceSchema.parse(node.props.source)[0]?.uri,
  );

describe('Spotlight', () => {
  it('draws its picture behind what is written about it', async () => {
    const drawn = await render(
      <Spotlight picture="/backdrop.jpg">
        <Text>Dune</Text>
      </Spotlight>,
    );

    expect(drawn.getByText('Dune')).toBeOnTheScreen();
    expect(picturesIn(drawn)).toEqual(['/backdrop.jpg']);
  });

  it('leaves the picture out where there is none', async () => {
    const drawn = await render(
      <Spotlight picture={null}>
        <Text>Dune</Text>
      </Spotlight>,
    );

    expect(picturesIn(drawn)).toEqual([]);
  });
});
