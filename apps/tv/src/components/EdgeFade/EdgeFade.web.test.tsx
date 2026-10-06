import { render } from '@testing-library/react';
import { Text } from 'react-native';
import { EdgeFade } from '@ValenceTv/components/EdgeFade/EdgeFade';

describe('EdgeFade in a browser', () => {
  it('masks what it holds out towards the edge it fades to', () => {
    const drawn = render(
      <EdgeFade edge="bottom" reach={0.4}>
        <Text>Picture</Text>
      </EdgeFade>,
    );
    const mask = drawn.getByText('Picture').parentElement?.style.getPropertyValue('mask-image');

    expect(mask).toContain('0deg');
    expect(mask).toContain('40%');
  });
});
