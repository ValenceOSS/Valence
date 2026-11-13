import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { chooseLanguageHere } from '@ValenceClient/language/chooseLanguageHere';
import { chosenLanguageHere } from '@ValenceClient/language/chosenLanguageHere';
import { ALanguageChoice } from './ALanguageChoice';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('ALanguageChoice', () => {
  it('names the language chosen on this phone, in itself', async () => {
    chooseLanguageHere('de');

    const drawn = await render(<ALanguageChoice />);

    expect(drawn.getAllByText('Language').length).toBeGreaterThan(0);
    expect(drawn.getByText('Deutsch')).toBeOnTheScreen();
  });

  it('follows the phone until somebody chooses', async () => {
    const drawn = await render(<ALanguageChoice />);

    expect(drawn.getByText('Same as this device')).toBeOnTheScreen();
  });

  it('lists every language in a sheet, and keeps the one chosen', async () => {
    const drawn = await render(<ALanguageChoice />);

    await userEvent.press(drawn.getByText('Same as this device'));
    await userEvent.press(await drawn.findByText('Italiano'));

    expect(chosenLanguageHere()).toBe('it');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ALanguageChoice.displayName).toBe('ALanguageChoice');
  });
});
