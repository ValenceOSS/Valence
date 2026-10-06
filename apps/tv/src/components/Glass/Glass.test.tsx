import { Platform, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Glass } from '@ValenceTv/components/Glass/Glass';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceTv/theme/withAlpha';

describe('Glass', () => {
  const was = Platform.OS;

  afterEach(() => {
    Platform.OS = was;
  });

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

  it('is the palette’s raised surface on android, rounded as asked', async () => {
    Platform.OS = 'android';

    const drawn = await render(
      <Glass cornerRadius={24}>
        <Text>Home</Text>
      </Glass>,
    );

    expect(drawn.toJSON()).toHaveStyle({
      backgroundColor: withAlpha(tokens.colours.raised, 0.92),
      borderRadius: 24,
    });
  });
});
