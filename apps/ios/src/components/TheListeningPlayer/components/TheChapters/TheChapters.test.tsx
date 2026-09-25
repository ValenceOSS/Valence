import { render, userEvent } from '@testing-library/react-native';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aFakeAudiobookPlayer } from '@ValencePhone/testing/aFakeAudiobookPlayer';
import { TheChapters } from './TheChapters';

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValencePhone/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => mockFake.player,
}));

beforeEach(() => {
  mockFake = aFakeAudiobookPlayer();

  const { book, chapters } = anAudiobook();

  mockFake.player.open(book, tracksOf(chapters), null);
  mockFake.audio.fire('loadedmetadata');
});

describe('TheChapters', () => {
  it('lists every chapter with how long it lasts, the one playing chosen', async () => {
    const drawn = await render(<TheChapters isOpen onClose={jest.fn()} />);

    expect(drawn.getByText('Chapters')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Part 1', selected: true })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'The Passage', selected: false })).toBeTruthy();
    expect(drawn.getAllByText('5:00')).toHaveLength(2);
  });

  it('goes straight to the chapter chosen, and puts itself away', async () => {
    const onClose = jest.fn();
    const drawn = await render(<TheChapters isOpen onClose={onClose} />);

    await userEvent.press(drawn.getByRole('button', { name: 'The Passage' }));

    expect(mockFake.player.read().bookPositionSeconds).toBe(900);
    expect(onClose).toHaveBeenCalled();
  });
});
