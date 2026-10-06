import { render } from '@testing-library/react-native';
import { Animated, View } from 'react-native';
import { StretchPill } from '@ValenceTv/components/StretchPill/StretchPill';

describe('StretchPill', () => {
  it('puts a round end at each side and stretches the bar between them', async () => {
    const drawn = await render(
      <View testID="pill">
        <StretchPill
          x={new Animated.Value(120)}
          width={new Animated.Value(140)}
          height={60}
          colour="#ffffff"
        />
      </View>,
    );
    const [middle, left, right] = drawn.getByTestId('pill').children;

    expect(left).toHaveStyle({
      width: 60,
      height: 60,
      borderRadius: 30,
      transform: [{ translateX: 120 }],
    });
    expect(right).toHaveStyle({ width: 60, transform: [{ translateX: 200 }] });
    expect(middle).toHaveStyle({
      width: 100,
      height: 60,
      backgroundColor: '#ffffff',
      transform: [{ translateX: 140 }, { scaleX: 0.8 }],
    });
  });
});
