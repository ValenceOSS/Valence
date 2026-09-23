import { render } from '@testing-library/react-native';
import { ALoginMark } from './ALoginMark';

describe('ALoginMark', () => {
  it('draws the mark on the way in', async () => {
    const drawn = await render(<ALoginMark high={80} isIntroducing={false} settlesAfter={0} />);

    expect(drawn.getByLabelText('Valence')).toBeTruthy();
  });
});
