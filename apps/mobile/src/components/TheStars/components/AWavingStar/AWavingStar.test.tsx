import { render } from '@testing-library/react-native';
import { AWavingStar } from './AWavingStar';

describe('AWavingStar', () => {
  it('draws a star, lit or not', async () => {
    const lit = await render(
      <AWavingStar isLit wave={0} delay={0} size={20} litColour="#f5d589" restColour="#a4a4a4" />,
    );

    expect(lit.toJSON()).not.toBeNull();
  });
});
