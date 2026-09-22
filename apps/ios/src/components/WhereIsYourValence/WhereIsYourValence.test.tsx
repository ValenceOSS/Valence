import { render, userEvent } from '@testing-library/react-native';
import { WhereIsYourValence } from './WhereIsYourValence';

describe('WhereIsYourValence', () => {
  it('asks the one question a phone cannot answer itself', async () => {
    const drawn = await render(<WhereIsYourValence onChosen={jest.fn()} />);

    expect(drawn.getByText('Where is your Valence?')).toBeTruthy();
  });

  it('hands over the address somebody typed', async () => {
    const onChosen = jest.fn();
    const drawn = await render(<WhereIsYourValence onChosen={onChosen} />);

    await userEvent.type(drawn.getByLabelText('Server address'), 'http://192.168.1.36:8420');
    await userEvent.press(drawn.getByText('Connect'));

    expect(onChosen).toHaveBeenCalledWith('http://192.168.1.36:8420');
  });

  it('trims what was typed, since an address pasted from a browser carries spaces', async () => {
    const onChosen = jest.fn();
    const drawn = await render(<WhereIsYourValence onChosen={onChosen} />);

    await userEvent.type(drawn.getByLabelText('Server address'), '  http://one.local:8420  ');
    await userEvent.press(drawn.getByText('Connect'));

    expect(onChosen).toHaveBeenCalledWith('http://one.local:8420');
  });

  it('says why the last address did not work, where it did not', async () => {
    const drawn = await render(
      <WhereIsYourValence onChosen={jest.fn()} refusal="That server did not answer." />,
    );

    expect(drawn.getByText('That server did not answer.')).toBeTruthy();
  });

  it('says nothing about a refusal that has not happened', async () => {
    const drawn = await render(<WhereIsYourValence onChosen={jest.fn()} />);

    expect(drawn.queryByText(/did not answer/)).toBeNull();
  });
});
