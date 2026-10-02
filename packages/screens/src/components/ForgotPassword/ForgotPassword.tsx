import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { askForPasswordReset } from '@ValenceClient/session/askForPasswordReset';
import type { ForgotPasswordProps } from './ForgotPassword.types';
import { say } from '@ValenceI18n/say';

const RESET_PAGE = '/reset-password';

/**
 * The way back in for somebody who forgot their password: asks which account by its username or
 * its address, and asks the server for a reset link. The answer is the same whether or not the
 * account exists, and says where the link goes — their inbox where the server sends email, and the
 * server's log for whoever runs it otherwise.
 *
 * @param initialIdentifier - What to start the field with, such as an address already typed.
 */
const ForgotPassword = ({ initialIdentifier = '' }: ForgotPasswordProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState<'asked' | 'failed' | null>(null);

  const close = () => {
    setIsOpen(false);
    setAnswer(null);
  };

  const ask = async () => {
    setIsAsking(true);

    const isTaken = await askForPasswordReset(
      { identifier: identifier.trim() },
      new URL(RESET_PAGE, window.location.origin).toString(),
    );

    setIsAsking(false);
    setAnswer(isTaken ? 'asked' : 'failed');
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIdentifier((before) => (before === '' ? initialIdentifier : before));
          setIsOpen(true);
        }}
      >
        {say('common.forgotYourPassword')}
      </Button>

      <Dialog
        label={say('screens.forgotPassword.resetYourPassword')}
        isOpen={isOpen}
        onClose={close}
      >
        <DialogContent>
          <DialogTitle title={say('screens.forgotPassword.resetYourPassword')} />

          {answer === 'asked' ? (
            <p role="status" className="pt-2 text-sm leading-relaxed text-text-muted">
              {say('screens.forgotPassword.ifAnAccountAnswersToThat')}
            </p>
          ) : (
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-sm leading-relaxed text-text-muted">
                {say('screens.forgotPassword.typeYourUsernameOrTheEmail')}
              </p>

              <TextField
                label={say('screens.forgotPassword.usernameOrEmail')}
                value={identifier}
                hasFocusOnMount
                autoComplete="username"
                onValueChange={setIdentifier}
                {...(answer === 'failed' ? { error: say('error.common.thatCouldNotBeDone') } : {})}
              />
            </div>
          )}
        </DialogContent>

        {answer === 'asked' ? (
          <DialogFooter confirm={{ label: say('common.done'), onChoose: close }} />
        ) : (
          <DialogFooter
            dismiss={{ label: say('common.notNow'), onChoose: close }}
            confirm={{
              label: say('screens.forgotPassword.sendMeALink'),
              onChoose: () => {
                void ask();
              },
              isLoading: isAsking,
              isDisabled: identifier.trim() === '',
            }}
          />
        )}
      </Dialog>
    </>
  );
};

ForgotPassword.displayName = 'ForgotPassword';

export { ForgotPassword };
