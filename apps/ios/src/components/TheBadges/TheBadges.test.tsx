import { render } from '@testing-library/react-native';
import { TheBadges } from './TheBadges';

describe('TheBadges', () => {
  it('says each thing about the picture and sound', async () => {
    const drawn = await render(<TheBadges badges={['4K', 'Dolby Vision']} />);

    expect(drawn.getByText('4K')).toBeTruthy();
    expect(drawn.getByText('Dolby Vision')).toBeTruthy();
  });

  it('shortens the long names where it is asked to be short', async () => {
    const drawn = await render(<TheBadges badges={['Dolby Vision']} isShort />);

    expect(drawn.getByText('DV')).toBeTruthy();
  });

  it('draws nothing where there is nothing to say', async () => {
    const drawn = await render(<TheBadges badges={[]} />);

    expect(drawn.toJSON()).toBeNull();
  });
});
