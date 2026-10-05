import { render } from '@testing-library/react-native';
import { chooseFromTheMenu } from '@ValenceMobile/testing/chooseFromTheMenu';
import { theMenu } from '@ValenceMobile/testing/theMenu';
import { theMenuChoices } from '@ValenceMobile/testing/theMenuChoices';
import { AChoiceMenu } from './AChoiceMenu';

const LASTS = [
  { id: 'day', label: 'A day' },
  { id: 'week', label: 'A week' },
  { id: 'never', label: 'Until I stop it' },
] as const;

describe('AChoiceMenu', () => {
  it('offers every choice, however many there are, showing the one chosen', async () => {
    await render(
      <AChoiceMenu label="Link works for" items={LASTS} value="week" onSelect={jest.fn()} />,
    );

    expect(theMenuChoices('Link works for')).toEqual(['A day', 'A week', 'Until I stop it']);
    expect(theMenu('Link works for').props.selection).toBe('week');
  });

  it('says which was chosen', async () => {
    const onSelect = jest.fn();
    await render(
      <AChoiceMenu label="Link works for" items={LASTS} value="week" onSelect={onSelect} />,
    );

    await chooseFromTheMenu('Link works for', 'day');

    expect(onSelect).toHaveBeenCalledWith('day');
  });

  it('ignores a choice it never offered', async () => {
    const onSelect = jest.fn();
    await render(
      <AChoiceMenu label="Link works for" items={LASTS} value="week" onSelect={onSelect} />,
    );

    await chooseFromTheMenu('Link works for', 'year');

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AChoiceMenu.displayName).toBe('AChoiceMenu');
  });
});
