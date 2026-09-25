import { render, userEvent } from '@testing-library/react-native';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { BookShelf } from '@ValenceTv/components/BookShelf/BookShelf';

const { book } = anAudiobook();

const OTHER = { ...book, id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b0c', title: 'Golden Son' };

describe('BookShelf', () => {
  it('names the row and lays its books along it', async () => {
    const drawn = await render(
      <BookShelf
        title="Continue listening"
        books={[{ book, fraction: 0.5, detail: 'Part 2 · 9 min left' }, { book: OTHER }]}
        onOpen={jest.fn()}
      />,
    );

    expect(drawn.getByText('Continue listening')).toBeOnTheScreen();
    expect(drawn.getByText('Part 2 · 9 min left')).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: 'Golden Son' })).toBeOnTheScreen();
  });

  it('hands back the book chosen', async () => {
    const onOpen = jest.fn();
    const drawn = await render(<BookShelf title="Books" books={[{ book }]} onOpen={onOpen} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Red Rising' }));

    expect(onOpen).toHaveBeenCalledWith(book);
  });
});
