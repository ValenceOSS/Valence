import { render, userEvent } from '@testing-library/react-native';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { RequestCard } from '@ValenceTv/screens/Account/components/RequestCard/RequestCard';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';

const HALFWAY: RequestProgress = {
  downloadId: '00000000-0000-4000-8000-000000000001',
  state: 'downloading',
  progress: 0.5,
  sizeBytes: null,
  doneBytes: null,
  downloadBytesPerSecond: null,
  secondsLeft: null,
};

describe('RequestCard', () => {
  it('names the request and says where it stands', async () => {
    const drawn = await render(
      <RequestCard
        request={aMediaRequest()}
        going={null}
        onPress={jest.fn()}
        onFocus={jest.fn()}
      />,
    );

    expect(drawn.getByText('Dune')).toBeTruthy();
    expect(drawn.getByText('Requested')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Dune, Requested' })).toBeTruthy();
  });

  it('says how far through a download it is', async () => {
    const drawn = await render(
      <RequestCard
        request={aMediaRequest({ state: 'downloading' })}
        going={HALFWAY}
        onPress={jest.fn()}
        onFocus={jest.fn()}
      />,
    );

    expect(drawn.getByText(/^Downloading.* · 50%$/)).toBeTruthy();
  });

  it('says it is in the library once it is available', async () => {
    const drawn = await render(
      <RequestCard
        request={aMediaRequest({ state: 'available' })}
        going={null}
        onPress={jest.fn()}
        onFocus={jest.fn()}
      />,
    );

    expect(drawn.getByText('In your library')).toBeTruthy();
  });

  it('hands over the request it stands for when chosen', async () => {
    const onPress = jest.fn();
    const request = aMediaRequest();
    const drawn = await render(
      <RequestCard request={request} going={null} onPress={onPress} onFocus={jest.fn()} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Dune, Requested' }));

    expect(onPress).toHaveBeenCalledWith(request);
  });
});
