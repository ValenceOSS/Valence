import { act, render, userEvent } from '@testing-library/react-native';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { Listening } from '@ValenceTv/screens/Listening/Listening';
import { aFakeAudiobookPlayer } from '@ValenceTv/testing/aFakeAudiobookPlayer';

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValenceClient/books/theAudiobookPlayer', () => ({
  theAudiobookPlayer: () => mockFake.player,
}));

const openTheBook = (): void => {
  const { book, chapters } = anAudiobook();

  mockFake.player.open(book, tracksOf(chapters), null);
  mockFake.audio.fire('loadedmetadata');
  mockFake.audio.fire('playing');
};

const draw = async () => {
  const onEmpty = jest.fn();
  const onBack = jest.fn();
  const drawn = await render(<Listening onEmpty={onEmpty} onBack={onBack} />);

  return { drawn, onEmpty, onBack };
};

beforeEach(() => {
  mockFake = aFakeAudiobookPlayer();
});

describe('Listening', () => {
  it('says the chapter playing, the book and who wrote it, and how long is left', async () => {
    openTheBook();

    const { drawn } = await draw();

    expect(drawn.getByText('Part 1')).toBeTruthy();
    expect(drawn.getByText('Red Rising — Pierce Brown')).toBeTruthy();
    expect(drawn.getByText('20 min left in the book')).toBeTruthy();
  });

  it('pauses, and skips back fifteen seconds and on thirty', async () => {
    openTheBook();

    const { drawn } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'On 30 seconds' }));

    expect(mockFake.player.read().bookPositionSeconds).toBe(30);

    await userEvent.press(drawn.getByRole('button', { name: 'Back 15 seconds' }));

    expect(mockFake.player.read().bookPositionSeconds).toBe(15);

    await userEvent.press(drawn.getByRole('button', { name: 'Pause' }));

    expect(mockFake.audio.pause).toHaveBeenCalled();
  });

  it('moves to the next chapter', async () => {
    openTheBook();

    const { drawn } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Next chapter' }));

    expect(mockFake.player.read().bookPositionSeconds).toBe(600);
  });

  it('plays faster, chosen from a panel', async () => {
    openTheBook();

    const { drawn } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: '1×' }));
    await userEvent.press(drawn.getByRole('button', { name: '1.5×' }));

    expect(mockFake.player.read().speed).toBe(1.5);
    expect(drawn.queryByText('Speed')).toBeNull();
    expect(drawn.getByRole('button', { name: '1.5×' })).toBeTruthy();
  });

  it('stops at the end of the chapter, once asked', async () => {
    openTheBook();

    const { drawn } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Sleep timer' }));
    await userEvent.press(drawn.getByRole('button', { name: 'End of this chapter' }));

    expect(mockFake.player.read().sleep.kind).toBe('endOfChapter');
    expect(drawn.getByRole('button', { name: 'End of chapter' })).toBeTruthy();
  });

  it('goes straight to a chapter chosen from the list', async () => {
    openTheBook();

    const { drawn } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Chapters' }));
    await userEvent.press(drawn.getByRole('button', { name: 'The Passage, 5:00' }));

    expect(mockFake.player.read().bookPositionSeconds).toBe(900);
  });

  it('goes back from the button at the top left', async () => {
    openTheBook();

    const { drawn, onBack } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalled();
  });

  it('closes once no book is open', async () => {
    openTheBook();

    const { onEmpty } = await draw();

    expect(onEmpty).not.toHaveBeenCalled();

    await act(() => {
      mockFake.player.close();
    });

    expect(onEmpty).toHaveBeenCalled();
  });
});

describe('Listening, with a sleep timer', () => {
  it('says how many minutes are left before it stops', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(0);
    openTheBook();

    const { drawn } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Sleep timer' }));
    await userEvent.press(drawn.getByRole('button', { name: '15 minutes' }));

    expect(drawn.getByRole('button', { name: '15 min' })).toBeTruthy();

    jest.restoreAllMocks();
  });
});
