import { Alert } from 'react-native';
import { askBeforeActing } from './askBeforeActing';

describe('askBeforeActing', () => {
  it('asks in the system alert, with the plugin’s words, and goes ahead when told to', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, choices) => {
      choices?.find((choice) => choice.text === 'Continue')?.onPress?.();
    });

    await expect(askBeforeActing('Remove every show?')).resolves.toBe(true);
    expect(alert).toHaveBeenCalledWith(
      'Are you sure?',
      'Remove every show?',
      expect.any(Array),
      expect.any(Object),
    );
  });

  it('does not go ahead when somebody cancels', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, choices) => {
      choices?.find((choice) => choice.text === 'Cancel')?.onPress?.();
    });

    await expect(askBeforeActing('Remove every show?')).resolves.toBe(false);
  });

  it('does not go ahead when the alert is dismissed', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, _choices, options) => {
      options?.onDismiss?.();
    });

    await expect(askBeforeActing('Remove every show?')).resolves.toBe(false);
  });
});
