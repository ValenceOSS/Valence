import { Animated } from 'react-native';
import { render } from '@testing-library/react-native';
import { ASegment } from './ASegment';

describe('ASegment', () => {
  it('draws one segment of the ring, as bright as it is told', async () => {
    const drawn = await render(
      <ASegment
        glow={new Animated.Value(0.5)}
        colour="#ffffff"
        at={0}
        count={8}
        length={6}
        stroke={2}
        radius={9}
      />,
    );

    expect(drawn.toJSON()).toHaveStyle({ opacity: 0.5, width: 6, height: 2 });
  });
});
