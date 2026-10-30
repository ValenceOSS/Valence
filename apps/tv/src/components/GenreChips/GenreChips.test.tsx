import { render } from '@testing-library/react-native';
import { GenreChips } from '@ValenceTv/components/GenreChips/GenreChips';

describe('GenreChips', () => {
  it('sets the first three genres on chips', async () => {
    const drawn = await render(<GenreChips genres={['Drama', 'Romance', 'History', 'War']} />);

    expect(drawn.getByText('Drama')).toBeTruthy();
    expect(drawn.getByText('History')).toBeTruthy();
    expect(drawn.queryByText('War')).toBeNull();
  });

  it('draws nothing where there are no genres', async () => {
    const drawn = await render(<GenreChips genres={[]} />);

    expect(drawn.toJSON()).toBeNull();
  });
});
