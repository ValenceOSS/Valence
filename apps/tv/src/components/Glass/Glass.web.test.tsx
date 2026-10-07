import { render } from '@testing-library/react';
import { Text } from 'react-native';
import { Glass } from '@ValenceTv/components/Glass/Glass';

describe('Glass in a browser', () => {
  it('is drawn flat, holding what sits on it', () => {
    const drawn = render(
      <Glass cornerRadius={24}>
        <Text>Home</Text>
      </Glass>,
    );

    expect(drawn.getByText('Home').parentElement?.style.borderTopLeftRadius).toBe('24px');
  });
});
