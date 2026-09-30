import { LayoutAnimation } from 'react-native';
import { render, userEvent } from '@testing-library/react-native';
import { chooseTheme } from '@ValenceClient/shell/theme';
import { theColours } from '@ValenceMobile/theme/theColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import { ACapsuleRow } from './ACapsuleRow';

const PARTS = [
  { id: 'home', label: 'Home' },
  { id: 'films', label: 'Films' },
];

describe('ACapsuleRow', () => {
  it('offers every choice, and says which is picked', async () => {
    const drawn = await render(
      <ACapsuleRow label="What to show" items={PARTS} value="films" onSelect={jest.fn()} />,
    );

    expect(drawn.getByRole('button', { name: 'Films', selected: true })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Home', selected: false })).toBeTruthy();
  });

  it('says which was pressed', async () => {
    const onSelect = jest.fn();
    const drawn = await render(
      <ACapsuleRow label="What to show" items={PARTS} value="films" onSelect={onSelect} />,
    );

    await userEvent.press(drawn.getByText('Home'));

    expect(onSelect).toHaveBeenCalledWith('home');
  });
});

describe('ACapsuleRow, as a choice changes', () => {
  it('asks the system to spring the row into place as another is picked', async () => {
    const configureNext = jest.spyOn(LayoutAnimation, 'configureNext');
    const drawn = await render(
      <ACapsuleRow label="What to show" items={PARTS} value="films" onSelect={jest.fn()} />,
    );

    await userEvent.press(drawn.getByText('Home'));

    expect(configureNext.mock.calls[0]?.[0].update?.type).toBe('spring');
    configureNext.mockRestore();
  });

  it('does not animate pressing the one already picked', async () => {
    const configureNext = jest.spyOn(LayoutAnimation, 'configureNext');
    const drawn = await render(
      <ACapsuleRow label="What to show" items={PARTS} value="films" onSelect={jest.fn()} />,
    );

    await userEvent.press(drawn.getByText('Films'));

    expect(configureNext).not.toHaveBeenCalled();
    configureNext.mockRestore();
  });

  it('draws its track darker than a light page, so it can be seen on a white card', async () => {
    chooseTheme('light');

    const drawn = await render(
      <ACapsuleRow label="What to show" items={PARTS} value="films" onSelect={jest.fn()} />,
    );

    expect(JSON.stringify(drawn.toJSON())).toContain(withAlpha(theColours.light.border, 0.6));
  });

  it('leaves its track as it was in the dark', async () => {
    chooseTheme('dark');

    const drawn = await render(
      <ACapsuleRow label="What to show" items={PARTS} value="films" onSelect={jest.fn()} />,
    );

    expect(JSON.stringify(drawn.toJSON())).toContain(theColours.dark.surfaceRaised);
  });
});
