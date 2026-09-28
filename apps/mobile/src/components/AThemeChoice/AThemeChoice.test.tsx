import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { chosenPluginTheme } from '@ValenceClient/plugins/pluginThemeChoice';
import { keptPluginTheme } from '@ValenceClient/plugins/keptPluginTheme';
import { chosenTheme } from '@ValenceClient/shell/theme';
import { AThemeChoice } from './AThemeChoice';

jest.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('AThemeChoice', () => {
  it('chooses light or dark', async () => {
    jest
      .mocked(fetchPluginContributions)
      .mockResolvedValue(somePluginContributions({ themes: [] }));
    const drawn = await render(<AThemeChoice />, { wrapper: CacheScope });

    await userEvent.press(drawn.getByText('Light'));

    expect(chosenTheme()).toBe('light');
    expect(drawn.queryByText('Themes from plugins')).toBeNull();
  });

  it('chooses a plugin’s theme and keeps its colours, and goes back to Valence’s', async () => {
    jest.mocked(fetchPluginContributions).mockResolvedValue(somePluginContributions());
    const drawn = await render(<AThemeChoice />, { wrapper: CacheScope });

    await userEvent.press(await drawn.findByLabelText('Midnight, from Night Sky'));

    expect(chosenPluginTheme()).toBe('night-sky/midnight');
    expect(keptPluginTheme('night-sky/midnight')?.dark?.accent).toBe('#7c9cff');

    await userEvent.press(drawn.getByText('Valence'));

    expect(chosenPluginTheme()).toBeNull();
    expect(keptPluginTheme('night-sky/midnight')).toBeNull();
  });
});
