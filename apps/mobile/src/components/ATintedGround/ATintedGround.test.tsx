import { render } from '@testing-library/react-native';
import { ATintedGround } from './ATintedGround';

describe('ATintedGround', () => {
  it('draws the tint without taking a press', async () => {
    const drawn = await render(<ATintedGround tint="rgb(20, 40, 30)" />);

    expect(drawn.toJSON()).toHaveProp('pointerEvents', 'none');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ATintedGround.displayName).toBe('ATintedGround');
  });
});
