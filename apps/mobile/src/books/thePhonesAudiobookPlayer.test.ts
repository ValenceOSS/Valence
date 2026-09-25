import { tracksOf } from '@ValenceClient/books/tracksOf';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { thePhonesAudiobookPlayer } from '@ValenceMobile/books/thePhonesAudiobookPlayer';
import { aFakeAudiobookPlayer } from '@ValenceMobile/testing/aFakeAudiobookPlayer';
import { aFakeSpeaker } from '@ValenceMobile/testing/aFakeSpeaker';

let mockSpeaker = aFakeSpeaker();

let mockFake = aFakeAudiobookPlayer();

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: () => mockSpeaker.speaker,
}));

jest.mock('@ValenceClient/books/theAudiobookPlayer', () => ({
  theAudiobookPlayer: () => mockFake.player,
}));

const openTheBook = (): void => {
  const { book, chapters } = anAudiobook();

  mockFake.player.open(book, tracksOf(chapters), null);
  mockFake.audio.fire('loadedmetadata');
};

beforeEach(() => {
  mockSpeaker = aFakeSpeaker();
  mockFake = aFakeAudiobookPlayer();
});

describe('thePhonesAudiobookPlayer', () => {
  it('is the client’s own player', () => {
    expect(thePhonesAudiobookPlayer()).toBe(mockFake.player);
    expect(thePhonesAudiobookPlayer()).toBe(thePhonesAudiobookPlayer());
  });

  it('puts the chapter playing on the lock screen as though it were the whole of what plays', () => {
    thePhonesAudiobookPlayer();
    openTheBook();

    expect(mockSpeaker.speaker.describe).toHaveBeenLastCalledWith(
      'book',
      expect.objectContaining({
        title: 'Part 1',
        artist: 'Pierce Brown',
        album: 'Red Rising',
        from: 0,
        lasts: 600,
      }),
    );

    mockFake.player.goToChapter(2);
    mockFake.audio.fire('loadedmetadata');

    expect(mockSpeaker.speaker.describe).toHaveBeenLastCalledWith(
      'book',
      expect.objectContaining({ title: 'The Passage', from: 300, lasts: 300 }),
    );
  });

  it('tells the lock screen nothing new as the book only plays on', () => {
    thePhonesAudiobookPlayer();
    openTheBook();
    mockSpeaker.speaker.describe.mockClear();
    mockFake.audio.currentTime = 30;
    mockFake.audio.fire('timeupdate');

    expect(mockSpeaker.speaker.describe).not.toHaveBeenCalled();
  });

  it('answers the lock screen’s buttons for the book, and leaves the music’s alone', () => {
    thePhonesAudiobookPlayer();
    openTheBook();

    mockSpeaker.press({ channel: 'book', command: 'forward', seconds: 30 });
    expect(mockFake.player.read().bookPositionSeconds).toBe(30);

    mockSpeaker.press({ channel: 'book', command: 'back', seconds: 15 });
    expect(mockFake.player.read().bookPositionSeconds).toBe(15);

    mockSpeaker.press({ channel: 'music', command: 'next' });
    expect(mockFake.player.read().bookPositionSeconds).toBe(15);

    mockSpeaker.press({ channel: 'book', command: 'next' });
    mockFake.audio.fire('loadedmetadata');
    expect(mockFake.player.read().bookPositionSeconds).toBe(600);

    mockSpeaker.press({ channel: 'book', command: 'seek', seconds: 100 });
    expect(mockFake.player.read().bookPositionSeconds).toBe(700);

    mockSpeaker.press({ channel: 'book', command: 'rate', seconds: 1.5 });
    expect(mockFake.player.read().speed).toBe(1.5);

    mockSpeaker.press({ channel: 'book', command: 'pause' });
    expect(mockFake.audio.pause).toHaveBeenCalled();
  });
});
