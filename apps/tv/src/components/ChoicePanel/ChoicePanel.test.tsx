import { render, userEvent } from '@testing-library/react-native';
import { ChoicePanel } from '@ValenceTv/components/ChoicePanel/ChoicePanel';

const SPEEDS = [
  { id: '1', label: '1×', isCurrent: false },
  { id: '1.5', label: '1.5×', isCurrent: true },
];

describe('ChoicePanel', () => {
  it('names what is being chosen and lists the choices', async () => {
    const drawn = await render(<ChoicePanel title="Speed" choices={SPEEDS} onChoose={jest.fn()} />);

    expect(drawn.getByText('Speed')).toBeOnTheScreen();
    expect(drawn.getAllByRole('button')).toHaveLength(2);
  });

  it('reads a choice out with what it says beside it', async () => {
    const drawn = await render(
      <ChoicePanel
        title="Chapters"
        choices={[{ id: '0', label: 'The Institute', detail: '5:00', isCurrent: true }]}
        onChoose={jest.fn()}
      />,
    );

    expect(drawn.getByRole('button', { name: 'The Institute, 5:00' })).toBeOnTheScreen();
  });

  it('hands back which was chosen', async () => {
    const onChoose = jest.fn();
    const drawn = await render(<ChoicePanel title="Speed" choices={SPEEDS} onChoose={onChoose} />);

    await userEvent.press(drawn.getByRole('button', { name: '1×' }));

    expect(onChoose).toHaveBeenCalledWith('1');
  });
});
