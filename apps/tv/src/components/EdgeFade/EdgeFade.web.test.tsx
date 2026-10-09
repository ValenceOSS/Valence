import { render } from '@testing-library/react';
import { Text } from 'react-native';
import { EdgeFade } from '@ValenceTv/components/EdgeFade/EdgeFade';

describe('EdgeFade in a browser', () => {
  it('holds what it is given without masking it', () => {
    const drawn = render(
      <EdgeFade edge="bottom" reach={0.4}>
        <Text>Picture</Text>
      </EdgeFade>,
    );
    const holder = drawn.getByText('Picture').parentElement;

    expect(holder?.style.getPropertyValue('mask-image')).toBe('');
  });
});
