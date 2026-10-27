import { render, userEvent } from '@testing-library/react-native';
import { useLikeThis } from '@ValenceClient/library/useLikeThis';
import { ALikeThisShelf } from './ALikeThisShelf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

jest.mock('@ValenceClient/library/useLikeThis', () => ({ useLikeThis: jest.fn() }));
jest.mock('@ValenceClient/linking/useOriginOf', () => ({ useOriginOf: () => () => null }));

const item = (over: Partial<MediaSummary> = {}): MediaSummary => ({
  id: '9c858901-8a57-4791-81fe-4c455b099bc9',
  libraryId: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
  title: 'Arrival',
  year: 2016,
  durationSeconds: 7200,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
  ...over,
});

const PROGRAMME = item({
  id: '1d9b0d1c-3a54-4f3a-8f77-3a8d5b0f2c11',
  title: 'Good News',
  seriesId: 'severance',
  seriesTitle: 'Severance',
  seasonNumber: 1,
  episodeNumber: 1,
});

beforeEach(() => {
  jest.mocked(useLikeThis).mockReset().mockReturnValue([item(), PROGRAMME]);
});

describe('ALikeThisShelf', () => {
  it('names the shelf, and opens a film and a programme from it', async () => {
    const onLookAt = jest.fn();
    const onLookAtShow = jest.fn();
    const drawn = await render(
      <ALikeThisShelf mediaId="film" onLookAt={onLookAt} onLookAtShow={onLookAtShow} />,
    );

    expect(drawn.getByText('More like this')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Arrival'));
    await userEvent.press(drawn.getByLabelText('Severance'));

    expect(onLookAt).toHaveBeenCalledWith(item().id);
    expect(onLookAtShow).toHaveBeenCalledWith(PROGRAMME.libraryId, 'severance');
  });

  it('draws nothing where nothing is alike', async () => {
    jest.mocked(useLikeThis).mockReturnValue([]);

    const drawn = await render(
      <ALikeThisShelf mediaId="film" onLookAt={jest.fn()} onLookAtShow={jest.fn()} />,
    );

    expect(drawn.queryByText('More like this')).toBeNull();
  });
});
