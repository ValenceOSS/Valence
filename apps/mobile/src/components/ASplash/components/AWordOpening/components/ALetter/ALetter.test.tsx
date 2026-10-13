import { render } from '@testing-library/react-native';
import { ALetter } from './ALetter';

describe('ALetter', () => {
  it('is simply there for somebody who asked for less motion', async () => {
    const drawn = await render(
      <ALetter letter="V" isShown={false} waitsFor={0} isStill style={{}} />,
    );

    expect(drawn.getByText('V')).toBeTruthy();
  });
});
