import type { ReactElement } from 'react';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { RequestShelf } from '@ValenceTv/screens/RequestsPage/components/RequestShelf/RequestShelf';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

const HALFWAY: RequestProgress = {
  downloadId: '00000000-0000-4000-8000-000000000001',
  state: 'downloading',
  progress: 0.5,
  sizeBytes: null,
  doneBytes: null,
  downloadBytesPerSecond: null,
  secondsLeft: null,
};

const draw = (drawing: ReactElement) => render(drawing, { wrapper: CacheScope });

const DUNE = aMediaRequest({ id: '00000000-0000-4000-8000-00000000000a', title: 'Dune' });

const ARRIVAL = aMediaRequest({
  id: '00000000-0000-4000-8000-00000000000b',
  title: 'Arrival',
  state: 'downloading',
});

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RequestShelf', () => {
  it('names its part of the list and says how each download is going', async () => {
    const drawn = await draw(
      <RequestShelf
        name="In progress"
        requests={[DUNE, ARRIVAL]}
        goingOf={(request) => (request.id === ARRIVAL.id ? HALFWAY : null)}
        isFirst
        onFocus={jest.fn()}
        onOpen={jest.fn()}
      />,
    );

    expect(drawn.getByText('In progress')).toBeTruthy();
    expect(drawn.getByText(/50%/)).toBeTruthy();
    expect(drawn.getAllByRole('button')).toHaveLength(2);
  });

  it('says which request the remote rests on and which is chosen', async () => {
    const onFocus = jest.fn();
    const onOpen = jest.fn();
    const drawn = await draw(
      <RequestShelf
        name="Missing"
        requests={[DUNE]}
        goingOf={() => null}
        isFirst={false}
        onFocus={onFocus}
        onOpen={onOpen}
      />,
    );

    await fireEvent(drawn.getByRole('button', { name: 'Dune, Missing' }), 'focus');
    await userEvent.press(drawn.getByRole('button', { name: 'Dune, Missing' }));

    expect(onFocus).toHaveBeenCalledWith(DUNE);
    expect(onOpen).toHaveBeenCalledWith(DUNE);
  });
});
