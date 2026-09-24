import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { BookTile } from '@ValenceTv/components/BookTile/BookTile';

const { book } = anAudiobook();

describe('BookTile', () => {
  it('shows the title and who wrote it', async () => {
    const drawn = await render(<BookTile book={book} onPress={jest.fn()} />);

    expect(drawn.getByText('Red Rising')).toBeOnTheScreen();
    expect(drawn.getByText('Pierce Brown')).toBeOnTheScreen();
  });

  it('says how far somebody is, in place of who wrote it, where they have started it', async () => {
    const drawn = await render(
      <BookTile book={book} onPress={jest.fn()} fraction={0.5} detail="Part 2 · 9 min left" />,
    );

    expect(drawn.getByText('Part 2 · 9 min left')).toBeOnTheScreen();
    expect(drawn.queryByText('Pierce Brown')).toBeNull();
    expect(drawn.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('writes the title where the cover would be, where it has none', async () => {
    const drawn = await render(
      <BookTile book={{ ...book, hasCover: false }} onPress={jest.fn()} />,
    );

    expect(drawn.getAllByText('Red Rising')).toHaveLength(2);
  });

  it('hands back the book when chosen, and when the remote lands on it', async () => {
    const onPress = jest.fn();
    const onFocus = jest.fn();
    const drawn = await render(<BookTile book={book} onPress={onPress} onFocus={onFocus} />);

    await fireEvent(drawn.getByRole('button', { name: 'Red Rising' }), 'focus');
    await userEvent.press(drawn.getByRole('button', { name: 'Red Rising' }));

    expect(onFocus).toHaveBeenCalledWith(book);
    expect(onPress).toHaveBeenCalledWith(book);
  });
});
