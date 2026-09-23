import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { PageDot } from '@ValenceTv/components/PageDots/components/PageDot/PageDot';

describe('PageDot', () => {
  it('is a small dot for a turn that is not now', async () => {
    const drawn = await render(<PageDot isCurrent={false} fill={new Animated.Value(0)} />);

    expect(drawn.root).toHaveStyle({ width: 12, height: 12 });
    expect(drawn.root?.children).toHaveLength(0);
  });

  it('is a longer pill that fills as the turn now runs', async () => {
    const drawn = await render(<PageDot isCurrent fill={new Animated.Value(0.5)} />);
    const [filled] = drawn.root?.children ?? [];

    expect(drawn.root).toHaveStyle({ width: 56 });
    expect(filled).toHaveStyle({ transform: [{ scaleX: 0.5 }] });
  });
});
