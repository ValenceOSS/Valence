import { render } from '@testing-library/react-native';
import { LayersMark } from './LayersMark';

describe('LayersMark', () => {
  it('is a picture named for anybody who cannot see it, where it is given a name', async () => {
    const drawn = await render(<LayersMark width={70} height={66} label="Valence" />);

    expect(drawn.getByRole('image', { name: 'Valence' })).toBeTruthy();
  });

  it('is hidden from assistive technology where a name sits beside it instead', async () => {
    const drawn = await render(<LayersMark width={70} height={66} />);

    expect(drawn.queryByRole('image')).toBeNull();
  });

  it('sits in the box it is handed', async () => {
    const drawn = await render(<LayersMark width={120} height={40} />);

    expect(drawn.root).toHaveStyle({ width: 120, height: 40 });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LayersMark.displayName).toBe('LayersMark');
  });
});
