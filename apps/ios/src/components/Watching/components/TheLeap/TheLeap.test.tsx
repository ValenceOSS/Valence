import { render } from '@testing-library/react-native';
import { TheLeap } from './TheLeap';

describe('TheLeap', () => {
  it('says how far a double tap leapt', async () => {
    const drawn = await render(<TheLeap leap={{ way: 'forward', seconds: 20, count: 2 }} />);

    expect(drawn.getByText(/20/u)).toBeTruthy();
  });
});
