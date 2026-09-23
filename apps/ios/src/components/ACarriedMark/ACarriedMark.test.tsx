import { render } from '@testing-library/react-native';
import { ACarriedMark } from './ACarriedMark';

describe('ACarriedMark', () => {
  it('draws the mark, named for anybody who cannot see it', async () => {
    const drawn = await render(<ACarriedMark />);

    expect(drawn.getByLabelText('Valence')).toBeTruthy();
  });
});
