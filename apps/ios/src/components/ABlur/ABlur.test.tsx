import { render } from '@testing-library/react-native';
import { ABlur } from './ABlur';

describe('ABlur', () => {
  it('draws a blur that nothing can be pressed through by accident', async () => {
    const drawn = await render(<ABlur isDark isOn />);

    expect(drawn.toJSON()).toMatchObject({ props: { pointerEvents: 'none', isOn: true } });
  });

  it('is on unless it is told otherwise, and can be light or dark', async () => {
    const drawn = await render(<ABlur isDark={false} />);

    expect(drawn.toJSON()).toMatchObject({ props: { isOn: true, isDark: false } });
  });
});
