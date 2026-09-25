import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchProfiles, saveProfile } from '@ValenceClient/profiles/fetchProfiles';
import { aProfile } from '@ValenceMobile/testing/aProfile';
import { TheProfile } from './TheProfile';

jest.mock('@ValenceClient/profiles/fetchProfiles', () => ({
  ...jest.requireActual<object>('@ValenceClient/profiles/fetchProfiles'),
  fetchProfiles: jest.fn(),
  saveProfile: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchProfiles).mockResolvedValue([aProfile()]);
});

describe('TheProfile', () => {
  it('saves a new name once somebody presses Save', async () => {
    jest.mocked(saveProfile).mockResolvedValue(true);
    const drawn = await render(<TheProfile />, { wrapper: CacheScope });
    const name = await drawn.findByLabelText('Name');

    await userEvent.clear(name);
    await userEvent.type(name, 'Daniel');
    await userEvent.press(drawn.getByText('Save'));

    expect(saveProfile).toHaveBeenCalledWith(
      aProfile().id,
      'Daniel',
      aProfile().colour,
      aProfile().avatar,
      aProfile().askStillWatchingAfter,
    );
  });
});
