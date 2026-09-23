import { render } from '@testing-library/react-native';
import { GapDots } from '@ValenceTv/screens/NowPlaying/components/LyricLines/components/GapDots/GapDots';

const dotsAt = async (through: number) => {
  const drawn = await render(<GapDots through={through} />);

  return drawn.container.queryAll((node) => node.type === 'View' && node.children.length === 0);
};

describe('GapDots', () => {
  it('draws three dots, all faint, as the gap begins', async () => {
    const dots = await dotsAt(0);

    expect(dots).toHaveLength(3);

    for (const dot of dots) {
      expect(dot).toHaveStyle({ opacity: 0.3, transform: [{ scale: 0.8 }] });
    }
  });

  it('fills the dots in turn as the gap passes', async () => {
    const [first, second, third] = await dotsAt(1 / 3);

    expect(first).toHaveStyle({ opacity: 1, transform: [{ scale: 1 }] });
    expect(second).toHaveStyle({ opacity: 0.3, transform: [{ scale: 0.8 }] });
    expect(third).toHaveStyle({ opacity: 0.3, transform: [{ scale: 0.8 }] });
  });

  it('lights every dot once the gap is over, and never past full', async () => {
    const dots = await dotsAt(2);

    for (const dot of dots) {
      expect(dot).toHaveStyle({ opacity: 1, transform: [{ scale: 1 }] });
    }
  });
});
