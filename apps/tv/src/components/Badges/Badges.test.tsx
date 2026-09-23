import { render } from '@testing-library/react-native';
import { Badges } from '@ValenceTv/components/Badges/Badges';

describe('Badges', () => {
  it('marks each thing it is given', async () => {
    const drawn = await render(<Badges badges={['4K', 'Dolby Vision', '5.1']} />);

    expect(drawn.getByText('4K')).toBeTruthy();
    expect(drawn.getByText('Dolby Vision')).toBeTruthy();
    expect(drawn.getByText('5.1')).toBeTruthy();
  });

  it('draws nothing where there is nothing to mark', async () => {
    const drawn = await render(<Badges badges={[]} />);

    expect(drawn.toJSON()).toBeNull();
  });
});
