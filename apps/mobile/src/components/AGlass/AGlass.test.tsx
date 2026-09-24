import { render } from '@testing-library/react-native';
import { AGlass } from './AGlass';

describe('AGlass', () => {
  it('lays glass behind whatever holds it, rounded as asked, never in the way of a press', async () => {
    const drawn = await render(<AGlass roundness={20} />);

    expect(drawn.toJSON()).toMatchObject({ props: { roundness: 20, pointerEvents: 'none' } });
  });
});
