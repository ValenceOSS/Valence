import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import { TextField } from '@ValenceTv/components/TextField/TextField';

describe('TextField', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('says what it asks for', async () => {
    const drawn = await render(
      <TextField label="Server address" value="" onChange={jest.fn()} onSubmit={jest.fn()} />,
    );

    expect(drawn.getByText('Server address')).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: 'Server address' })).toBeOnTheScreen();
  });

  it('shows what it starts with', async () => {
    const drawn = await render(
      <TextField
        label="Server address"
        value="valence.local"
        onChange={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    expect(drawn.getByText('valence.local')).toBeOnTheScreen();
    expect(drawn.getByDisplayValue('valence.local')).toBeOnTheScreen();
  });

  it('shows its placeholder while empty', async () => {
    const drawn = await render(
      <TextField
        label="Server address"
        value=""
        placeholder="https://"
        onChange={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    expect(drawn.getByText('https://')).toBeOnTheScreen();
  });

  it('opens the keyboard when pressed', async () => {
    const focus = jest.spyOn(TextInput.prototype, 'focus');
    const drawn = await render(
      <TextField label="Server address" value="" onChange={jest.fn()} onSubmit={jest.fn()} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Server address' }));

    expect(focus).toHaveBeenCalled();
  });

  it('shows and says what is typed', async () => {
    const onChange = jest.fn();
    const drawn = await render(
      <TextField
        label="Server address"
        value=""
        placeholder="https://"
        onChange={onChange}
        onSubmit={jest.fn()}
      />,
    );

    await fireEvent.changeText(drawn.getByPlaceholderText('https://'), 'valence.local');

    expect(onChange).toHaveBeenCalledWith('valence.local');
    expect(drawn.getByText('valence.local')).toBeOnTheScreen();
  });

  it('hides a secret as it is typed', async () => {
    const drawn = await render(
      <TextField
        label="PIN"
        value=""
        placeholder="PIN"
        isSecret
        onChange={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    await fireEvent.changeText(drawn.getByPlaceholderText('PIN'), '1234');

    expect(drawn.getByText('••••')).toBeOnTheScreen();
    expect(drawn.queryByText('1234')).toBeNull();
  });

  it('says when the keyboard is done', async () => {
    const onSubmit = jest.fn();
    const drawn = await render(
      <TextField label="PIN" value="" placeholder="PIN" onChange={jest.fn()} onSubmit={onSubmit} />,
    );

    await fireEvent(drawn.getByPlaceholderText('PIN'), 'submitEditing');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('is outlined in white while the remote is on it', async () => {
    const drawn = await render(
      <TextField
        label="Server address"
        value=""
        placeholder="https://"
        onChange={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    const field = drawn.getByRole('button', { name: 'Server address' });

    expect(drawn.getByText('https://').parent).not.toHaveStyle({ borderColor: '#fafafa' });

    await fireEvent(field, 'focus');

    expect(drawn.getByText('https://').parent).toHaveStyle({ borderColor: '#fafafa' });
  });
});
