import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { TheDots } from './TheDots';

describe('TheDots', () => {
  it('draws a dot for each title, and a fill only in the one showing', async () => {
    const drawn = await render(<TheDots count={4} at={1} filled={new Animated.Value(0.5)} />);
    expect(drawn.getAllByTestId('dot')).toHaveLength(4);
    expect(drawn.getAllByTestId('dot-fill')).toHaveLength(1);
  });

  it('draws nothing for a single title', async () => {
    const drawn = await render(<TheDots count={1} at={0} filled={new Animated.Value(0)} />);

    expect(drawn.toJSON()).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TheDots.displayName).toBe('TheDots');
  });
});
