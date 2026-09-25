import { ActionSheetIOS } from 'react-native';
import { render, userEvent } from '@testing-library/react-native';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aFakeAudiobookPlayer } from '@ValencePhone/testing/aFakeAudiobookPlayer';
import { TheListeningPlayer } from './TheListeningPlayer';

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValencePhone/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => mockFake.player,
}));

const openTheBook = (): void => {
  const { book, chapters } = anAudiobook();

  mockFake.player.open(book, tracksOf(chapters), null);
  mockFake.audio.fire('loadedmetadata');
  mockFake.audio.fire('playing');
};

const pick = (at: number) =>
  jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, picked) => {
    picked(at);
  });

beforeEach(() => {
  mockFake = aFakeAudiobookPlayer();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('TheListeningPlayer', () => {
  it('says so while no book is open', async () => {
    const drawn = await render(<TheListeningPlayer onBack={jest.fn()} />, { wrapper: CacheScope });

    expect(drawn.getByText('Nothing is playing.')).toBeTruthy();
  });

  it('shows the chapter playing, the book and who wrote it', async () => {
    openTheBook();

    const drawn = await render(<TheListeningPlayer onBack={jest.fn()} />, { wrapper: CacheScope });

    expect(drawn.getByText('Part 1')).toBeTruthy();
    expect(drawn.getByText('Red Rising · Pierce Brown')).toBeTruthy();
  });

  it('pauses, goes on thirty seconds, back fifteen, and to the next chapter', async () => {
    openTheBook();

    const drawn = await render(<TheListeningPlayer onBack={jest.fn()} />, { wrapper: CacheScope });

    await userEvent.press(drawn.getByRole('button', { name: 'On 30 seconds' }));
    expect(mockFake.player.read().bookPositionSeconds).toBe(30);

    await userEvent.press(drawn.getByRole('button', { name: 'Back 15 seconds' }));
    expect(mockFake.player.read().bookPositionSeconds).toBe(15);

    await userEvent.press(drawn.getByRole('button', { name: 'Next chapter' }));
    expect(mockFake.player.read().bookPositionSeconds).toBe(600);

    await userEvent.press(drawn.getByRole('button', { name: 'Pause' }));
    expect(mockFake.audio.pause).toHaveBeenCalled();
  });

  it('plays faster and sets a sleep timer, saying so beneath the buttons', async () => {
    openTheBook();

    const drawn = await render(<TheListeningPlayer onBack={jest.fn()} />, { wrapper: CacheScope });

    pick(3);
    await userEvent.press(drawn.getByRole('button', { name: 'Speed, 1×' }));
    pick(4);
    await userEvent.press(drawn.getByRole('button', { name: 'Sleep timer' }));

    expect(mockFake.player.read().speed).toBe(1.5);
    expect(mockFake.player.read().sleep.kind).toBe('endOfChapter');
    expect(drawn.getByText('1.5× · Stops at the end of this chapter')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Sleep timer, on', selected: true })).toBeTruthy();
  });

  it('opens every chapter to go straight to', async () => {
    openTheBook();

    const drawn = await render(<TheListeningPlayer onBack={jest.fn()} />, { wrapper: CacheScope });

    await userEvent.press(drawn.getByRole('button', { name: 'Chapters' }));

    expect(drawn.getByRole('button', { name: 'The Institute' })).toBeTruthy();
  });
});
