import { render } from '@testing-library/react-native';
import { TheMark } from './TheMark';

describe('TheMark', () => {
  it('draws the mark, named for anybody who cannot see it', async () => {
    const drawn = await render(<TheMark high={40} />);

    expect(drawn.getByLabelText('Valence')).toBeTruthy();
  });
});
