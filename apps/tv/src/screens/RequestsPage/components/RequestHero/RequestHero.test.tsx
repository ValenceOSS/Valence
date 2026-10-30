import type { ReactElement } from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { RequestHero } from '@ValenceTv/screens/RequestsPage/components/RequestHero/RequestHero';
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

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

const draw = (drawing: ReactElement) => render(drawing, { wrapper: CacheScope });

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RequestHero', () => {
  it('names what was asked for, its year, where it stands and what it is about', async () => {
    const drawn = await draw(
      <RequestHero
        request={aMediaRequest({
          approval: 'awaiting',
          state: 'awaitingApproval',
          overview: 'A desert planet.',
        })}
        going={null}
        isSomeoneElses={false}
        film={null}
        picture={null}
        logoPath={null}
      />,
    );

    expect(drawn.getByText('Dune')).toBeTruthy();
    expect(drawn.getByText('2021   ·   Waiting for approval')).toBeTruthy();
    expect(drawn.getByText('A desert planet.')).toBeTruthy();
  });

  it('says whose request it is where it is someone else’s', async () => {
    const drawn = await draw(
      <RequestHero
        request={aMediaRequest()}
        going={null}
        isSomeoneElses
        film={null}
        picture={null}
        logoPath={null}
      />,
    );

    expect(drawn.getByText('2021   ·   Missing   ·   Requested by Sam')).toBeTruthy();
  });

  it('says how a download is going while it downloads', async () => {
    const drawn = await draw(
      <RequestHero
        request={aMediaRequest({ state: 'downloading' })}
        going={HALFWAY}
        isSomeoneElses={false}
        film={null}
        picture={null}
        logoPath={null}
      />,
    );

    expect(drawn.getByText(/50%/)).toBeTruthy();
  });

  it('names the page and says what it is handed where nothing is there yet', async () => {
    const drawn = await draw(
      <RequestHero
        request={null}
        going={null}
        isSomeoneElses={false}
        film={null}
        picture={null}
        logoPath={null}
      >
        <Text>Nothing yet</Text>
      </RequestHero>,
    );

    expect(drawn.getByText('Requests')).toBeTruthy();
    expect(drawn.getByText('Nothing yet')).toBeTruthy();
  });
});
