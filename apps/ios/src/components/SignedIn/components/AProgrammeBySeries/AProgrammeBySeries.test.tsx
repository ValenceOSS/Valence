import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchLibraries } from '@ValenceClient/library/fetchLibrary';
import { AProgrammeBySeries } from './AProgrammeBySeries';

jest.mock('@ValenceClient/library/fetchLibrary', () => ({
  ...jest.requireActual<object>('@ValenceClient/library/fetchLibrary'),
  fetchLibraries: jest.fn(),
}));

describe('AProgrammeBySeries', () => {
  it('waits, with the way back, while it finds which programme the series is', async () => {
    installPlatform(aFakePlatform());
    jest.mocked(fetchLibraries).mockReturnValue(new Promise(() => undefined));
    const onBack = jest.fn();
    const drawn = await render(
      <AProgrammeBySeries
        seriesId="severance"
        onWatch={jest.fn()}
        onLookAt={jest.fn()}
        onBack={onBack}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalled();
  });
});
