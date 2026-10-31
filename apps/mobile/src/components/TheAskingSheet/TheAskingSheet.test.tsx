import { act, render, userEvent } from '@testing-library/react-native';
import { theSheetsAsked } from '@ValenceMobile/platform/theSheetsAsked';
import { theColours } from '@ValenceMobile/theme/theColours';
import { TheAskingSheet } from './TheAskingSheet';

describe('TheAskingSheet', () => {
  it('lists the choices asked about, without the one that cancels, and answers with the one pressed', async () => {
    const onPicked = jest.fn();
    const drawn = await render(<TheAskingSheet />);

    await act(() => {
      theSheetsAsked().ask(
        {
          title: 'Download at',
          message: 'Saved on this phone.',
          options: ['Original', '1080p', 'Cancel'],
          cancelButtonIndex: 2,
          disabledButtonIndices: [0],
        },
        onPicked,
      );
    });

    expect(drawn.getByText('Download at')).toBeTruthy();
    expect(drawn.getByText('Saved on this phone.')).toBeTruthy();
    expect(drawn.queryByText('Cancel')).toBeNull();

    await userEvent.press(drawn.getByRole('button', { name: 'Original' }));
    await userEvent.press(drawn.getByRole('button', { name: '1080p' }));

    expect(onPicked.mock.calls).toEqual([[1]]);
  });

  it('marks a choice that removes something in red, and keeps what it said while it goes', async () => {
    const drawn = await render(<TheAskingSheet />);

    await act(() => {
      theSheetsAsked().ask(
        {
          title: 'Delete download',
          options: ['Delete', 'Cancel'],
          cancelButtonIndex: 1,
          destructiveButtonIndex: 0,
        },
        jest.fn(),
      );
    });

    expect(drawn.getByText('Delete')).toHaveStyle({ color: theColours.light.danger });

    await userEvent.press(drawn.getByRole('button', { name: 'Delete' }));

    expect(drawn.getByText('Delete download')).toBeTruthy();
  });

  it('answers with the choice that cancels when it is put away', async () => {
    const onPicked = jest.fn();

    await render(<TheAskingSheet />);
    await act(() => {
      theSheetsAsked().ask(
        { title: 'Download at', options: ['1080p', 'Cancel'], cancelButtonIndex: 1 },
        onPicked,
      );
    });
    await act(() => {
      theSheetsAsked().answer(null);
    });

    expect(onPicked).toHaveBeenCalledWith(1);
  });
});
