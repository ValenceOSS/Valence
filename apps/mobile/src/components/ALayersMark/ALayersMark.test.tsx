import { render } from '@testing-library/react-native';
import { ALayersMark } from './ALayersMark';

describe('ALayersMark', () => {
  it('is a picture named for anybody who cannot see it, where it is given a name', async () => {
    const drawn = await render(
      <ALayersMark width={70} height={66} ink="#ffffff" label="Valence" />,
    );

    expect(drawn.getByRole('image', { name: 'Valence' })).toBeTruthy();
  });

  it('is hidden from assistive technology where a name sits beside it instead', async () => {
    const drawn = await render(<ALayersMark width={70} height={66} ink="#ffffff" />);

    expect(drawn.queryByRole('image')).toBeNull();
  });

  it('sits in the box it is handed', async () => {
    const drawn = await render(<ALayersMark width={120} height={40} ink="#ffffff" />);

    expect(drawn.root).toHaveStyle({ width: 120, height: 40 });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ALayersMark.displayName).toBe('ALayersMark');
  });
});
