import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { FocusFence } from '@ValenceTv/components/FocusFence/FocusFence';

describe('FocusFence', () => {
  it('still shows what it fences while it is shut', async () => {
    const drawn = await render(
      <FocusFence isShut>
        <Text>Settings</Text>
      </FocusFence>,
    );

    expect(drawn.getByText('Settings')).toBeTruthy();
  });

  it('is laid out as it is told', async () => {
    const drawn = await render(
      <FocusFence isShut={false} style={{ flex: 1 }}>
        <Text>Settings</Text>
      </FocusFence>,
    );

    expect(drawn.toJSON()).toHaveStyle({ flex: 1 });
  });
});
