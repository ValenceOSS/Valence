import { render, userEvent } from '@testing-library/react-native';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { RequestRow } from '@ValenceTv/screens/RequestsPage/components/RequestRow/RequestRow';
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

describe('RequestRow', () => {
  it('names what was asked for, its year and where it stands', async () => {
    const drawn = await render(
      <RequestRow
        request={aMediaRequest({ approval: 'awaiting', state: 'awaitingApproval' })}
        going={null}
        isSomeoneElses={false}
        hasPreferredFocus={false}
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByText('Dune   ·   2021')).toBeTruthy();
    expect(drawn.getByText('Waiting for approval')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Dune, Waiting for approval' })).toBeTruthy();
  });

  it('says whose request it is where it is someone else’s', async () => {
    const drawn = await render(
      <RequestRow
        request={aMediaRequest()}
        going={null}
        isSomeoneElses
        hasPreferredFocus={false}
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByText('Requested   ·   Asked for by Sam')).toBeTruthy();
  });

  it('says how a download is going while it downloads', async () => {
    const drawn = await render(
      <RequestRow
        request={aMediaRequest({ state: 'downloading' })}
        going={HALFWAY}
        isSomeoneElses={false}
        hasPreferredFocus={false}
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByText(/^Downloading/)).toBeTruthy();
    expect(drawn.getByText(/50%/)).toBeTruthy();
  });

  it('hands over the request when chosen', async () => {
    const onPress = jest.fn();
    const request = aMediaRequest();
    const drawn = await render(
      <RequestRow
        request={request}
        going={null}
        isSomeoneElses={false}
        hasPreferredFocus
        onPress={onPress}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Dune, Requested' }));

    expect(onPress).toHaveBeenCalledWith(request);
  });
});
