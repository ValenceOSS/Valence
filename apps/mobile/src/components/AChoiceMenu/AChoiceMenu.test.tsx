import { render, userEvent } from '@testing-library/react-native';
import { AChoiceMenu } from './AChoiceMenu';

const LASTS = [
  { id: 'day', label: 'A day' },
  { id: 'week', label: 'A week' },
  { id: 'never', label: 'Until I stop it' },
] as const;

describe('AChoiceMenu', () => {
  it('offers every choice, however many there are', async () => {
    const drawn = await render(
      <AChoiceMenu label="Link works for" items={LASTS} value="week" onSelect={jest.fn()} />,
    );

    expect(drawn.getByLabelText('Link works for')).toBeTruthy();
    expect(drawn.getByText('Until I stop it')).toBeTruthy();
  });

  it('says which was chosen', async () => {
    const onSelect = jest.fn();
    const drawn = await render(
      <AChoiceMenu label="Link works for" items={LASTS} value="week" onSelect={onSelect} />,
    );

    await userEvent.press(drawn.getByText('A day'));

    expect(onSelect).toHaveBeenCalledWith('day');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AChoiceMenu.displayName).toBe('AChoiceMenu');
  });
});
