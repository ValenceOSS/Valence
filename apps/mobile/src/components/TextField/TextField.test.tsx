import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { DeviceEventEmitter } from 'react-native';
import { FIELD_FOCUSED } from '@ValenceMobile/components/Screen/FIELD_FOCUSED';
import { TextField } from './TextField';

describe('TextField', () => {
  it('is named by its label rather than by what it is showing', async () => {
    const drawn = await render(
      <TextField label="Server address" value="" onValueChange={jest.fn()} placeholder="http://" />,
    );

    expect(drawn.getByLabelText('Server address')).toBeTruthy();
  });

  it('says what somebody typed', async () => {
    const onValueChange = jest.fn();
    const drawn = await render(
      <TextField label="Server address" value="" onValueChange={onValueChange} />,
    );

    await userEvent.type(drawn.getByLabelText('Server address'), 'http://one.local');

    expect(onValueChange).toHaveBeenCalled();
  });

  it('hides a secret', async () => {
    const drawn = await render(
      <TextField label="Password" value="hunter2" isSecret onValueChange={jest.fn()} />,
    );

    expect(drawn.getByLabelText('Password').props.secureTextEntry).toBe(true);
  });

  it('shows what is not a secret', async () => {
    const drawn = await render(
      <TextField label="Server address" value="http://one" onValueChange={jest.fn()} />,
    );

    expect(drawn.getByLabelText('Server address').props.secureTextEntry).toBe(false);
  });

  it('offers the keyboard that suits an address', async () => {
    const drawn = await render(
      <TextField label="Server address" value="" keyboard="url" onValueChange={jest.fn()} />,
    );

    expect(drawn.getByLabelText('Server address').props.keyboardType).toBe('url');
  });

  it('offers a saved password for a secret, and fills nothing for a plain field', async () => {
    const drawn = await render(
      <>
        <TextField label="Password" value="" isSecret onValueChange={jest.fn()} />
        <TextField label="Name" value="" onValueChange={jest.fn()} />
      </>,
    );

    expect(drawn.getByLabelText('Password').props.textContentType).toBe('password');
    expect(drawn.getByLabelText('Password').props.autoComplete).toBe('current-password');
    expect(drawn.getByLabelText('Name').props.textContentType).toBe('none');
  });

  it('fills an address and a code from what is typed into them', async () => {
    const drawn = await render(
      <>
        <TextField label="Server address" value="" keyboard="url" onValueChange={jest.fn()} />
        <TextField label="Code" value="" keyboard="code" onValueChange={jest.fn()} />
      </>,
    );

    expect(drawn.getByLabelText('Server address').props.textContentType).toBe('URL');
    expect(drawn.getByLabelText('Code').props.textContentType).toBe('oneTimeCode');
  });

  it('fills what it is told it holds over what it would guess', async () => {
    const drawn = await render(
      <TextField label="Party password" value="" isSecret fills="none" onValueChange={jest.fn()} />,
    );

    expect(drawn.getByLabelText('Party password').props.textContentType).toBe('none');
  });

  it('keeps a field out of sight and away from a screen reader', async () => {
    const drawn = await render(
      <TextField label="Name" value="Dan" fills="username" isOffScreen onValueChange={jest.fn()} />,
    );
    const field = drawn.getByLabelText('Name', { includeHiddenElements: true });

    expect(field.props.textContentType).toBe('username');
    expect(field.props.accessibilityElementsHidden).toBe(true);
    expect(drawn.queryByText('Name')).toBeNull();
  });

  it('says when it is chosen, so the page can keep it clear of the keyboard', async () => {
    const emit = jest.spyOn(DeviceEventEmitter, 'emit');
    const drawn = await render(<TextField label="Name" value="" onValueChange={jest.fn()} />);

    await fireEvent(drawn.getByLabelText('Name'), 'focus');

    expect(emit).toHaveBeenCalledWith(FIELD_FOCUSED);

    emit.mockRestore();
  });
});
