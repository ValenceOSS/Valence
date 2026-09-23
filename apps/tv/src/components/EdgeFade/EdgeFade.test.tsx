import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { EdgeFade } from '@ValenceTv/components/EdgeFade/EdgeFade';

describe('EdgeFade', () => {
  it('holds what it fades', async () => {
    const drawn = await render(
      <EdgeFade edge="bottom" reach={0.5}>
        <Text>Backdrop</Text>
      </EdgeFade>,
    );

    expect(drawn.getByText('Backdrop')).toBeTruthy();
  });

  it('is laid out as it is told', async () => {
    const drawn = await render(
      <EdgeFade edge="left" reach={0.3} style={{ height: 400 }}>
        <Text>Backdrop</Text>
      </EdgeFade>,
    );

    expect(drawn.toJSON()).toHaveStyle({ height: 400 });
  });
});
