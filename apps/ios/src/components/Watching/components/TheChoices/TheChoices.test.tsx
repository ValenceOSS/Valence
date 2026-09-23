import { render, userEvent } from '@testing-library/react-native';
import { TheChoices } from './TheChoices';
import type { ASetOfChoices } from './TheChoices.types';

const audio: ASetOfChoices = {
  heading: 'Audio',
  chosen: '2',
  choices: [
    { id: '1', label: 'Japanese' },
    { id: '2', label: 'English' },
  ],
  onChoose: jest.fn(),
};

const quality: ASetOfChoices = {
  heading: 'Quality',
  chosen: 'original',
  choices: [
    { id: 'original', label: 'Original', detail: 'As it is on the server' },
    { id: '1080p', label: '1080p', detail: 'up to 4.5 Mbps' },
  ],
  onChoose: jest.fn(),
};

describe('TheChoices', () => {
  it('shows every set it was given', async () => {
    const drawn = await render(<TheChoices sets={[audio, quality]} onClose={jest.fn()} />);

    expect(drawn.getByText('Audio')).toBeTruthy();
    expect(drawn.getByText('Quality')).toBeTruthy();
  });

  it('shows what there is to choose', async () => {
    const drawn = await render(<TheChoices sets={[audio]} onClose={jest.fn()} />);

    expect(drawn.getByText('Japanese')).toBeTruthy();
    expect(drawn.getByText('English')).toBeTruthy();
  });

  it('says which one is in force, so it is not only a tick', async () => {
    const drawn = await render(<TheChoices sets={[audio]} onClose={jest.fn()} />);

    expect(drawn.getByRole('button', { name: 'English', selected: true })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Japanese', selected: false })).toBeTruthy();
  });

  it('says what a choice would cost, where that is the thing being weighed', async () => {
    const drawn = await render(<TheChoices sets={[quality]} onClose={jest.fn()} />);

    expect(drawn.getByText('up to 4.5 Mbps')).toBeTruthy();
  });

  it('says which one they picked', async () => {
    const onChoose = jest.fn();
    const drawn = await render(<TheChoices sets={[{ ...audio, onChoose }]} onClose={jest.fn()} />);

    await userEvent.press(drawn.getByText('Japanese'));

    expect(onChoose).toHaveBeenCalledWith('1');
  });

  it('closes on the button', async () => {
    const onClose = jest.fn();
    const drawn = await render(<TheChoices sets={[audio]} onClose={onClose} />);

    const [, onTheButton] = drawn.getAllByLabelText('Close the settings');

    await userEvent.press(onTheButton ?? drawn.getByText('Settings'));

    expect(onClose).toHaveBeenCalled();
  });

  it('closes when they press the film behind it', async () => {
    const onClose = jest.fn();
    const drawn = await render(<TheChoices sets={[audio]} onClose={onClose} />);

    const [behindIt] = drawn.getAllByLabelText('Close the settings');

    await userEvent.press(behindIt ?? drawn.getByText('Settings'));

    expect(onClose).toHaveBeenCalled();
  });

  it('draws nothing to choose where there is nothing to choose', async () => {
    const drawn = await render(<TheChoices sets={[]} onClose={jest.fn()} />);

    expect(drawn.getByText('Settings')).toBeTruthy();
    expect(drawn.queryByText('Audio')).toBeNull();
  });
});
