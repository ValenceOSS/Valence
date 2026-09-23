import { render } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { useColorScheme } from 'react-native';
import { theColours } from '@ValencePhone/theme/theColours';
import { Words } from '@ValencePhone/components/Words/Words';
import { Screen } from './Screen';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('dark');
});

describe('Screen', () => {
  it('draws what is on it', async () => {
    const drawn = await render(
      <Screen>
        <Words>On the ground</Words>
      </Screen>,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('On the ground')).toBeTruthy();
  });

  it('draws it on the theme ground', async () => {
    const drawn = await render(
      <Screen>
        <Words>On the ground</Words>
      </Screen>,
      { wrapper: CacheScope },
    );

    expect(JSON.stringify(drawn.toJSON())).toContain(theColours.dark.surface);
  });

  it('scrolls where there is more than fits', async () => {
    const drawn = await render(
      <Screen scrolls>
        <Words>Long</Words>
      </Screen>,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('Long')).toBeTruthy();
  });
});
