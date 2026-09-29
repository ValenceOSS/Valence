import { Appearance } from 'react-native';
import { render } from '@testing-library/react-native';
import { chooseTheme } from '@ValenceClient/shell/theme';
import { TheChosenAppearance } from './TheChosenAppearance';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('TheChosenAppearance', () => {
  it('puts the system in the appearance somebody chose, and draws nothing', async () => {
    jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);
    chooseTheme('dark');

    const drawn = await render(<TheChosenAppearance />);

    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('dark');
    expect(drawn.toJSON()).toBeNull();
  });
});
