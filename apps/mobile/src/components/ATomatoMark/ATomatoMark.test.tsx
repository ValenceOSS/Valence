import { render } from '@testing-library/react-native';
import { ATomatoMark } from './ATomatoMark';

describe('ATomatoMark', () => {
  it('draws the fresh tomato from 60% up', async () => {
    const drawn = await render(<ATomatoMark score={60} />);

    expect(drawn.getByRole('image', { name: 'Fresh on Rotten Tomatoes' })).toBeTruthy();
  });

  it('draws the green splat below that', async () => {
    const drawn = await render(<ATomatoMark score={42} />);

    expect(drawn.getByRole('image', { name: 'Rotten on Rotten Tomatoes' })).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ATomatoMark.displayName).toBe('ATomatoMark');
  });
});
