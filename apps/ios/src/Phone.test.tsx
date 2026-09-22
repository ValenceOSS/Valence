import { render } from '@testing-library/react-native';
import { Phone } from './Phone';

describe('Phone', () => {
  it('draws what the client is called', async () => {
    const drawn = await render(<Phone />);

    expect(drawn.getByText('Valence')).toBeTruthy();
  });

  it('reads a contract out of the shared schemas, on the phone', async () => {
    const drawn = await render(<Phone />);

    expect(drawn.getByText('shared contracts say V')).toBeTruthy();
  });
});
