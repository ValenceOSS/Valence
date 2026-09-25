import { act, render } from '@testing-library/react-native';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aFakeAudiobookPlayer } from '@ValenceMobile/testing/aFakeAudiobookPlayer';
import { ThePlaceInTheChapter } from './ThePlaceInTheChapter';

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValenceMobile/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => mockFake.player,
}));

beforeEach(() => {
  mockFake = aFakeAudiobookPlayer();
});

describe('ThePlaceInTheChapter', () => {
  it('shows how far through the chapter it is, what is left of it and of the book', async () => {
    const { book, chapters } = anAudiobook();

    mockFake.player.open(book, tracksOf(chapters), null);
    mockFake.audio.fire('loadedmetadata');

    const drawn = await render(<ThePlaceInTheChapter title="Part 1" />);

    await act(() => {
      mockFake.audio.currentTime = 75;
      mockFake.audio.fire('timeupdate');
    });

    expect(drawn.getByText('1:15')).toBeTruthy();
    expect(drawn.getByText('−8:45')).toBeTruthy();
    expect(drawn.getByText('19 min left')).toBeTruthy();
  });

  it('says what is left of the book at the speed it plays', async () => {
    const { book, chapters } = anAudiobook();

    mockFake.player.open(book, tracksOf(chapters), null);
    mockFake.audio.fire('loadedmetadata');
    mockFake.player.setSpeed(2);

    const drawn = await render(<ThePlaceInTheChapter title="Part 1" />);

    expect(drawn.getByText('10 min left')).toBeTruthy();
  });
});
