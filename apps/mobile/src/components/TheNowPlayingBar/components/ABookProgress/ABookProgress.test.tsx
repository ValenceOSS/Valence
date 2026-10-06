import { act, render } from '@testing-library/react-native';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aFakeAudiobookPlayer } from '@ValenceMobile/testing/aFakeAudiobookPlayer';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ABookProgress } from './ABookProgress';

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValenceMobile/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => mockFake.player,
}));

beforeEach(() => {
  mockFake = aFakeAudiobookPlayer();
});

describe('ABookProgress', () => {
  it('follows how far through the whole book it is', async () => {
    const { book, chapters } = anAudiobook();

    await act(() => {
      mockFake.player.open(book, tracksOf(chapters), null);
      mockFake.audio.fire('loadedmetadata');
    });

    await render(<ABookProgress />);

    expect(theDrawnRoot()).toHaveProp('accessibilityElementsHidden', true);
    expect(theDrawnRoot().children).toHaveLength(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ABookProgress.displayName).toBe('ABookProgress');
  });
});
