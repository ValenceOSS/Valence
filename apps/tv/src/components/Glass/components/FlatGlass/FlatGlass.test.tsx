import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { FlatGlass } from '@ValenceTv/components/Glass/components/FlatGlass/FlatGlass';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceTv/theme/withAlpha';

describe('FlatGlass', () => {
  it('is the palette’s raised surface, rounded as asked, holding what sits on it', async () => {
    const drawn = await render(
      <FlatGlass cornerRadius={24} style={{ width: 320 }}>
        <Text>Home</Text>
      </FlatGlass>,
    );

    expect(drawn.getByText('Home')).toBeTruthy();
    expect(drawn.toJSON()).toHaveStyle({
      backgroundColor: withAlpha(tokens.colours.raised, 0.92),
      borderRadius: 24,
      width: 320,
    });
  });
});
