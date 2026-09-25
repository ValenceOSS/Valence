import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchPerson, fetchPersonCredits } from '@ValenceClient/library/fetchPerson';
import { aTitle } from '@ValenceMobile/testing/aTitle';
import { APerson } from './APerson';

jest.mock('@ValenceClient/library/fetchPerson');

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('APerson', () => {
  it('shows who somebody is and what they are in here, each opening', async () => {
    jest.mocked(fetchPerson).mockResolvedValue({
      id: 7,
      name: 'Amy Adams',
      portraitUrl: null,
      biography: 'An actor.',
      bornOn: null,
      bornIn: null,
    });
    jest
      .mocked(fetchPersonCredits)
      .mockResolvedValue({ films: [aTitle()], shows: [], episodes: [] });
    const onLookAt = jest.fn();
    const drawn = await render(
      <APerson personId={7} onLookAt={onLookAt} onLookAtShow={jest.fn()} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('Amy Adams')).toBeTruthy();

    await userEvent.press(await drawn.findByRole('button', { name: 'Arrival' }));

    expect(onLookAt).toHaveBeenCalledWith(aTitle().id);
  });
});
