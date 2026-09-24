import { render, userEvent, waitFor } from '@testing-library/react-native';
import { TheSearchBox } from './TheSearchBox';

describe('TheSearchBox', () => {
  it('says what it is waiting for before anything is typed', async () => {
    const drawn = await render(<TheSearchBox placeholder="Films, music" onSettle={jest.fn()} />);

    expect(drawn.getByPlaceholderText('Films, music')).toBeTruthy();
  });

  it('says what to look for, trimmed, once the typing stops', async () => {
    const onSettle = jest.fn();
    const drawn = await render(<TheSearchBox placeholder="Films" onSettle={onSettle} />);

    await userEvent.type(drawn.getByLabelText('Search'), ' dune ');

    await waitFor(() => {
      expect(onSettle).toHaveBeenLastCalledWith('dune');
    });
    expect(onSettle).not.toHaveBeenCalledWith('d');
  });
});
