import { render } from '@testing-library/react-native';
import { Icon } from './Icon';
import { Pause } from '@ValencePhone/glyphs/Pause';
import { Play } from '@ValencePhone/glyphs/Play';

describe('Icon', () => {
  it('draws the glyph it was asked for', async () => {
    const drawn = await render(<Icon of={Play} colour="#ffffff" label="Play" />);

    expect(drawn.getByLabelText('Play')).toBeTruthy();
  });

  it('is passed over by anybody who cannot see it, where the words beside it already said it', async () => {
    const drawn = await render(<Icon of={Play} colour="#ffffff" />);

    expect(drawn.queryByLabelText('Play')).toBeNull();
  });

  it('draws a different glyph when asked for one', async () => {
    const drawn = await render(<Icon of={Pause} colour="#ffffff" label="Pause" />);

    expect(drawn.getByLabelText('Pause')).toBeTruthy();
  });
});
