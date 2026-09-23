import { render, userEvent, waitFor } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { whicheverAnswers } from '@ValencePhone/platform/whicheverAnswers';
import { WhereIsYourValence } from './WhereIsYourValence';

jest.mock('@ValencePhone/platform/whicheverAnswers');

beforeEach(() => {
  jest.mocked(whicheverAnswers).mockReset().mockResolvedValue('http://one.local:8420');
});

describe('WhereIsYourValence', () => {
  it('asks the one question a phone cannot answer itself', async () => {
    const drawn = await render(<WhereIsYourValence onChosen={jest.fn()} />, {
      wrapper: CacheScope,
    });

    expect(drawn.getByText('Where is your Valence?')).toBeTruthy();
  });

  it('hands over the address that answered', async () => {
    jest.mocked(whicheverAnswers).mockResolvedValue('http://192.168.1.36:8420');

    const onChosen = jest.fn();
    const drawn = await render(<WhereIsYourValence onChosen={onChosen} />, { wrapper: CacheScope });

    await userEvent.type(drawn.getByLabelText('Server address'), 'http://192.168.1.36:8420');
    await userEvent.press(drawn.getByText('Connect'));

    await waitFor(() => {
      expect(onChosen).toHaveBeenCalledWith('http://192.168.1.36:8420');
    });
  });

  it('tries what somebody meant, not only what they wrote', async () => {
    const drawn = await render(<WhereIsYourValence onChosen={jest.fn()} />, {
      wrapper: CacheScope,
    });

    await userEvent.type(drawn.getByLabelText('Server address'), 'valence.example');
    await userEvent.press(drawn.getByText('Connect'));

    await waitFor(() => {
      expect(whicheverAnswers).toHaveBeenCalledWith([
        'https://valence.example',
        'http://valence.example',
      ]);
    });
  });

  it('says so where nothing is there, rather than keeping an address that does not work', async () => {
    jest.mocked(whicheverAnswers).mockResolvedValue(null);

    const onChosen = jest.fn();
    const drawn = await render(<WhereIsYourValence onChosen={onChosen} />, { wrapper: CacheScope });

    await userEvent.type(drawn.getByLabelText('Server address'), 'valence.example');
    await userEvent.press(drawn.getByText('Connect'));

    await waitFor(() => {
      expect(drawn.getByText('Nothing answered at that address.')).toBeTruthy();
    });

    expect(onChosen).not.toHaveBeenCalled();
  });

  it('asks nothing where nothing was typed', async () => {
    const drawn = await render(<WhereIsYourValence onChosen={jest.fn()} />, {
      wrapper: CacheScope,
    });

    await userEvent.press(drawn.getByText('Connect'));

    expect(whicheverAnswers).not.toHaveBeenCalled();
  });

  it('trims what was typed, since an address pasted from a browser carries spaces', async () => {
    const onChosen = jest.fn();
    const drawn = await render(<WhereIsYourValence onChosen={onChosen} />, { wrapper: CacheScope });

    await userEvent.type(drawn.getByLabelText('Server address'), '  http://one.local:8420  ');
    await userEvent.press(drawn.getByText('Connect'));

    await waitFor(() => {
      expect(whicheverAnswers).toHaveBeenCalledWith(['http://one.local:8420']);
    });

    expect(onChosen).toHaveBeenCalledWith('http://one.local:8420');
  });

  it('says why the last address did not work, where it did not', async () => {
    const drawn = await render(
      <WhereIsYourValence onChosen={jest.fn()} refusal="That server did not answer." />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('That server did not answer.')).toBeTruthy();
  });

  it('says nothing about a refusal that has not happened', async () => {
    const drawn = await render(<WhereIsYourValence onChosen={jest.fn()} />, {
      wrapper: CacheScope,
    });

    expect(drawn.queryByText(/did not answer/)).toBeNull();
  });
});
