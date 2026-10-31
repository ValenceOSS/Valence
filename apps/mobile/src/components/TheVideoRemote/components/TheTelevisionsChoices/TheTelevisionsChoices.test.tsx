import { render, userEvent } from '@testing-library/react-native';
import { TheTelevisionsChoices } from './TheTelevisionsChoices';
import type { ASetOfChoices } from '@ValenceMobile/components/Watching/components/TheChoices/TheChoices.types';

const aSet = (heading: string, onChoose = jest.fn()): ASetOfChoices => ({
  heading,
  chosen: 'one',
  choices: [
    { id: 'one', label: `${heading} one` },
    { id: 'two', label: `${heading} two`, detail: 'Saves about half' },
    { id: 'three', label: `${heading} three`, isDisabled: true },
  ],
  onChoose,
});

describe('TheTelevisionsChoices', () => {
  it('lists a setting’s choices with the one in force chosen, and no heading of its own', async () => {
    const drawn = await render(
      <TheTelevisionsChoices title="Quality" sets={[aSet('Quality')]} isOpen onClose={jest.fn()} />,
    );

    expect(drawn.getByRole('button', { name: 'Quality one', selected: true })).toBeTruthy();
    expect(drawn.getByText('Saves about half')).toBeTruthy();
    expect(drawn.getAllByText('Quality')).toHaveLength(1);
  });

  it('heads each setting where the sheet holds more than one', async () => {
    const drawn = await render(
      <TheTelevisionsChoices
        title="Audio & Subtitles"
        sets={[aSet('Audio'), aSet('Subtitles')]}
        isOpen
        onClose={jest.fn()}
      />,
    );

    expect(drawn.getByText('Audio')).toBeTruthy();
    expect(drawn.getByText('Subtitles')).toBeTruthy();
  });

  it('chooses on the television and puts itself away, but not what cannot be chosen', async () => {
    const onChoose = jest.fn();
    const onClose = jest.fn();
    const drawn = await render(
      <TheTelevisionsChoices
        title="Quality"
        sets={[aSet('Quality', onChoose)]}
        isOpen
        onClose={onClose}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Quality three' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Quality two' }));

    expect(onChoose.mock.calls).toEqual([['two']]);
    expect(onClose).toHaveBeenCalled();
  });
});
