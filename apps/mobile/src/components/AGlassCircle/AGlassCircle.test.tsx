import { SlidersHorizontal } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AGlassCircle } from './AGlassCircle';

jest.mock('@ValenceMobile/platform/hasLiquidGlass', () => ({
  hasLiquidGlass: jest.fn(() => false),
}));

beforeEach(() => {
  jest.mocked(hasLiquidGlass).mockReset().mockReturnValue(false);
});

describe('AGlassCircle', () => {
  it('is a round button named for what it does', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <AGlassCircle of={SlidersHorizontal} label="Contents and settings" onPress={onPress} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Contents and settings' }));

    expect(onPress).toHaveBeenCalled();
  });

  it('draws its icon in the ink it is given on liquid glass', async () => {
    jest.mocked(hasLiquidGlass).mockReturnValue(true);
    await render(
      <AGlassCircle
        of={SlidersHorizontal}
        label="Contents and settings"
        onPress={jest.fn()}
        ink="#1a1a1a"
      />,
    );

    expect(theDrawnRoot().queryAll((node) => node.props.color === '#1a1a1a')).not.toHaveLength(0);
  });
});
