import { Alert } from 'react-native';
import { askToConfirmOnTv } from './askToConfirmOnTv';

describe('askToConfirmOnTv', () => {
  it('goes ahead when somebody continues', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, choices) => {
      choices?.find((choice) => choice.text === 'Continue')?.onPress?.();
    });

    await expect(askToConfirmOnTv('Remove every show?')).resolves.toBe(true);
  });

  it('does not go ahead when somebody cancels', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, choices) => {
      choices?.find((choice) => choice.text === 'Cancel')?.onPress?.();
    });

    await expect(askToConfirmOnTv('Remove every show?')).resolves.toBe(false);
  });

  it('does not go ahead when the alert is dismissed', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, _choices, options) => {
      options?.onDismiss?.();
    });

    await expect(askToConfirmOnTv('Remove every show?')).resolves.toBe(false);
  });
});
