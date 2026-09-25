import { render, userEvent } from '@testing-library/react-native';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aFakeAudiobookPlayer } from '@ValenceMobile/testing/aFakeAudiobookPlayer';
import { TheChoices } from './TheChoices';

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValenceMobile/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => mockFake.player,
}));

beforeEach(() => {
  mockFake = aFakeAudiobookPlayer();

  const { book, chapters } = anAudiobook();

  mockFake.player.open(book, tracksOf(chapters), null);
  mockFake.audio.fire('loadedmetadata');
});

describe('TheChoices', () => {
  it('lists every chapter with how long it lasts, the one playing chosen', async () => {
    const drawn = await render(<TheChoices panel="chapters" onClose={jest.fn()} />);

    expect(drawn.getByText('Chapters')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Part 1', selected: true })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'The Passage', selected: false })).toBeTruthy();
    expect(drawn.getAllByText('5:00')).toHaveLength(2);
  });

  it('goes straight to the chapter chosen, and puts itself away', async () => {
    const onClose = jest.fn();
    const drawn = await render(<TheChoices panel="chapters" onClose={onClose} />);

    await userEvent.press(drawn.getByRole('button', { name: 'The Passage' }));

    expect(mockFake.player.read().bookPositionSeconds).toBe(900);
    expect(onClose).toHaveBeenCalled();
  });

  it('plays faster, and sets a sleep timer', async () => {
    const speed = await render(<TheChoices panel="speed" onClose={jest.fn()} />);

    expect(speed.getByText('Speed')).toBeTruthy();
    await userEvent.press(speed.getByRole('button', { name: '1.5×' }));
    await speed.unmount();

    const sleep = await render(<TheChoices panel="sleep" onClose={jest.fn()} />);

    await userEvent.press(sleep.getByRole('button', { name: 'End of this chapter' }));

    expect(mockFake.player.read().speed).toBe(1.5);
    expect(mockFake.player.read().sleep.kind).toBe('endOfChapter');
  });

  it('draws nothing to choose from while no list is out', async () => {
    const drawn = await render(<TheChoices panel={null} onClose={jest.fn()} />);

    expect(drawn.queryByRole('button', { name: 'Part 1' })).toBeNull();
  });
});
