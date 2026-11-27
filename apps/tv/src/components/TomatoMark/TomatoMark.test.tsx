import { render } from '@testing-library/react-native';
import { TomatoMark } from '@ValenceTv/components/TomatoMark/TomatoMark';

describe('TomatoMark', () => {
  it('draws the fresh tomato for a score the critics were mostly kind to', async () => {
    const drawn = await render(<TomatoMark score={87} />);

    expect(drawn.getByRole('image', { name: 'Fresh on Rotten Tomatoes' })).toBeTruthy();
  });

  it('draws the splat for a score they were not', async () => {
    const drawn = await render(<TomatoMark score={31} />);

    expect(drawn.getByRole('image', { name: 'Rotten on Rotten Tomatoes' })).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TomatoMark.displayName).toBe('TomatoMark');
  });
});
