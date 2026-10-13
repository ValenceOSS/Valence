import { render } from '@testing-library/react-native';
import { ASegment } from './ASegment';

describe('ASegment', () => {
  it('draws one segment of the ring', async () => {
    const drawn = await render(
      <ASegment isLit colour="#ffffff" at={0} count={8} length={6} stroke={2} radius={9} />,
    );

    expect(drawn.toJSON()).not.toBeNull();
  });
});
