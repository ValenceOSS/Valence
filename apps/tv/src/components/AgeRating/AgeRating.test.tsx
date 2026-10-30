import { render } from '@testing-library/react-native';
import { AgeRating } from '@ValenceTv/components/AgeRating/AgeRating';

describe('AgeRating', () => {
  it('draws the board’s own mark for a certificate it publishes one for', async () => {
    const drawn = await render(<AgeRating certification="12A" region="GB" />);

    expect(drawn.getByRole('image')).toBeTruthy();
    expect(drawn.queryByText('12A')).toBeNull();
  });

  it('writes out a certificate there is no mark for', async () => {
    const drawn = await render(<AgeRating certification="K-16" region="FI" />);

    expect(drawn.getByText('K-16')).toBeTruthy();
  });
});
