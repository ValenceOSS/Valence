import { render, userEvent } from '@testing-library/react-native';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { ACalendarEntry } from './ACalendarEntry';

const mockPicture = jest.fn<null, [{ uri: string }]>(() => null);

jest.mock('@ValenceMobile/components/ARemotePicture/ARemotePicture', () => ({
  ARemotePicture: (props: { uri: string }) => mockPicture(props),
}));

beforeEach(() => {
  mockPicture.mockClear();
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

afterEach(() => {
  forgetPlatform();
});

describe('ACalendarEntry', () => {
  it('names the episode and where it has got to', async () => {
    const drawn = await render(<ACalendarEntry entry={aCalendarEntry()} onOpen={jest.fn()} />);

    expect(drawn.getByText('A Show')).toBeTruthy();
    expect(drawn.getByText('S2 E5 · Fifth')).toBeTruthy();
    expect(drawn.getByText('Not out yet')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'A Show, S2 E5 · Fifth' })).toBeTruthy();
  });

  it('says which release of a film it is, and who asked for it', async () => {
    const drawn = await render(
      <ACalendarEntry
        entry={aCalendarEntry({
          title: 'Dune',
          episode: null,
          release: 'cinema',
          state: 'wanted',
          source: 'request',
          requestedBy: { id: 'sam', name: 'Sam' },
        })}
        onOpen={jest.fn()}
      />,
    );

    expect(drawn.getByText('In cinemas')).toBeTruthy();
    expect(drawn.getByText('Wanted · Sam')).toBeTruthy();
  });

  it('draws the library’s poster where the library holds it', async () => {
    await render(<ACalendarEntry entry={aCalendarEntry()} onOpen={jest.fn()} />);

    expect(mockPicture).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: 'http://one.local:8420/api/media/2b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b/image/poster',
      }),
    );
  });

  it('draws the catalogue’s poster where it was only asked for, and none where there is none', async () => {
    await render(
      <ACalendarEntry
        entry={aCalendarEntry({ artworkMediaId: null, posterUrl: '/api/catalogue/poster/1.jpg' })}
        onOpen={jest.fn()}
      />,
    );

    expect(mockPicture).toHaveBeenLastCalledWith(
      expect.objectContaining({ uri: 'http://one.local:8420/api/catalogue/poster/1.jpg' }),
    );

    mockPicture.mockClear();
    await render(
      <ACalendarEntry
        entry={aCalendarEntry({ artworkMediaId: null, posterUrl: null })}
        onOpen={jest.fn()}
      />,
    );

    expect(mockPicture).not.toHaveBeenCalled();
  });

  it('hands over the entry when pressed', async () => {
    const onOpen = jest.fn();
    const entry = aCalendarEntry();
    const drawn = await render(<ACalendarEntry entry={entry} onOpen={onOpen} />);

    await userEvent.press(drawn.getByRole('button', { name: 'A Show, S2 E5 · Fifth' }));

    expect(onOpen).toHaveBeenCalledWith(entry);
  });
});
