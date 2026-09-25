import { render } from '@testing-library/react-native';
import { AScrim } from './AScrim';

describe('AScrim', () => {
  it('darkens what is beneath without being in the way of a press', async () => {
    const drawn = await render(<AScrim />);

    expect(drawn.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });
});
