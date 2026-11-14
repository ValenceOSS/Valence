import { render, userEvent } from '@testing-library/react-native';
import { LanguageChoice } from '@ValenceTv/screens/Account/components/LanguageChoice/LanguageChoice';

describe('LanguageChoice', () => {
  it('names the language chosen here, in itself, and opens the list when pressed', async () => {
    const onOpen = jest.fn();
    const drawn = await render(
      <LanguageChoice chosen="fr" isTurningNextTime={false} onOpen={onOpen} />,
    );

    await userEvent.press(drawn.getByText('Français'));

    expect(onOpen).toHaveBeenCalled();
  });

  it('says the layout turns the next time Valence opens, where it does', async () => {
    const drawn = await render(<LanguageChoice chosen="ar" isTurningNextTime onOpen={jest.fn()} />);

    expect(drawn.getByText(/next time Valence opens/u)).toBeOnTheScreen();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LanguageChoice.displayName).toBe('LanguageChoice');
  });
});
