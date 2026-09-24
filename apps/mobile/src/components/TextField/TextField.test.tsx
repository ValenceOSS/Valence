import { render, userEvent } from '@testing-library/react-native';
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
});
