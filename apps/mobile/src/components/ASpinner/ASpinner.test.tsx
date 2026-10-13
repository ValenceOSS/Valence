import { render } from '@testing-library/react-native';
import { ASpinner } from './ASpinner';

describe('ASpinner', () => {
  it('says what is being waited for', async () => {
    const drawn = await render(<ASpinner label="Loading the film" />);

    expect(drawn.getByLabelText('Loading the film')).toBeTruthy();
  });
});
