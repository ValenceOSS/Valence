import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Glass } from '@ValenceTv/components/Glass/Glass';

describe('Glass', () => {
  it('holds what sits on it', async () => {
    const drawn = await render(
      <Glass cornerRadius={24}>
        <Text>Home</Text>
      </Glass>,
    );

    expect(drawn.getByText('Home')).toBeTruthy();
  });

  it('is laid out as it is told', async () => {
    const drawn = await render(
      <Glass cornerRadius={24} style={{ width: 320 }}>
        <Text>Home</Text>
      </Glass>,
    );

    expect(drawn.toJSON()).toHaveStyle({ width: 320 });
  });
});
