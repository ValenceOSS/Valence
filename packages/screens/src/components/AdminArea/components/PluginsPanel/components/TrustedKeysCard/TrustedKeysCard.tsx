import { useState } from 'react';
import {
  Key as KeyFilledIcon,
  Plus as PlusFilledIcon,
  X as XIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Form } from '@ValenceUI/Form';
import { Icon } from '@ValenceUI/Icon';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { PanelCard } from '@ValenceUI/PanelCard';
import { TextField } from '@ValenceUI/TextField';
import { saveTrustedKeys } from '@ValenceClient/plugins/saveTrustedKeys';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import type { TrustedKey } from '@ValenceContracts/schemas/Plugin';
import type { TrustedKeysCardProps } from './TrustedKeysCard.types';
import { say } from '@ValenceI18n/say';

/**
 * Lists the signing keys this server trusts beside Valence's own and lets an administrator add one,
 * or remove a saved one once they confirm, leaving keys the environment sets untouched.
 *
 * @param keys - Every key trusted now.
 * @param onSaved - Told the keys changed.
 */
const TrustedKeysCard = ({ keys, onSaved }: TrustedKeysCardProps) => {
  const [id, setId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [forgetting, setForgetting] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const idProblem =
    isChecked && id.trim() === ''
      ? say('screens.pluginsPanel.trustedKeysCard.giveTheKeyItsId')
      : null;
  const keyProblem =
    isChecked && publicKey.trim() === ''
      ? say('screens.pluginsPanel.trustedKeysCard.pasteThePublicKey')
      : null;
  const [answered, setAnswered] = useState<{
    after: TrustedKeysCardProps['keys'];
    keys: TrustedKeysCardProps['keys'];
  } | null>(null);
  const shown = answered !== null && answered.after === keys ? answered.keys : keys;
  const saved = shown.filter((key) => !key.isFromVariable);

  const save = (next: TrustedKey[], said: string): Promise<boolean> => {
    setIsSaving(true);

    return saveTrustedKeys(next)
      .then((now) => {
        setAnswered({ after: keys, keys: now });
        tellOutcome(said, null);
        setId('');
        setPublicKey('');
        setIsChecked(false);
        onSaved();

        return true;
      })
      .catch((problem: Error) => {
        tellOutcome('', problem.message);

        return false;
      })
      .finally(() => {
        setIsSaving(false);
        setForgetting(null);
      });
  };

  const closeAdding = () => {
    setIsAdding(false);
    setIsChecked(false);
  };

  return (
    <PanelCard
      title={say('screens.pluginsPanel.trustedKeysCard.trustedSigningKeys')}
      isFlush
      actions={
        <span className="flex items-center gap-2">
          <PanelCardInfo
            label={say('screens.pluginsPanel.trustedKeysCard.aboutTrustedSigningKeys')}
            detail={say('screens.pluginsPanel.trustedKeysCard.pluginsSignedByOneOfThese')}
          />
          <PanelCardAction
            icon={PlusFilledIcon}
            onClick={() => {
              setIsAdding(true);
            }}
          >
            {say('screens.adminArea.serviceKeyRow.addKey')}
          </PanelCardAction>
        </span>
      }
    >
      {shown.length === 0 ? (
        <p className="px-5 py-4 text-[0.8125rem] text-text-muted">
          {say('screens.pluginsPanel.trustedKeysCard.onlyValencesOwnKey')}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
          {shown.map((key) => (
            <li key={key.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-text-muted">
                <Icon of={KeyFilledIcon} size={15} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-mono text-[0.8125rem] text-text">{key.id}</span>
                <span className="truncate font-mono text-xs text-text-muted">{key.publicKey}</span>
              </span>
              {key.isFromVariable ? (
                <Badge size="sm">
                  {say('screens.pluginsPanel.trustedKeysCard.setByTheEnvironment')}
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => {
                    setForgetting(key.id);
                  }}
                >
                  {say('common.forget')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        label={say('screens.pluginsPanel.trustedKeysCard.trustASigningKey')}
        isOpen={isAdding}
        onClose={closeAdding}
      >
        <DialogTitle title={say('screens.pluginsPanel.trustedKeysCard.trustASigningKey')}>
          <Button
            isIconOnly
            variant="ghost"
            label={say('common.close')}
            size="sm"
            onClick={closeAdding}
          >
            <Icon of={XIcon} size={16} />
          </Button>
        </DialogTitle>
        <Form
          label={say('screens.pluginsPanel.trustedKeysCard.trustASigningKey')}
          isDialog
          onSubmit={(event) => {
            event.preventDefault();
            setIsChecked(true);

            if (id.trim() === '' || publicKey.trim() === '') {
              return;
            }

            void save(
              [
                ...saved.map((key) => ({ id: key.id, publicKey: key.publicKey })),
                { id: id.trim(), publicKey: publicKey.trim() },
              ],
              say('screens.pluginsPanel.trustedKeysCard.nowTrustingId', { id: id.trim() }),
            ).then((isSaved) => {
              if (isSaved) {
                closeAdding();
              }
            });
          }}
        >
          <DialogContent>
            <div className="flex flex-col gap-4">
              <p className="text-[0.8125rem] text-text-muted">
                {say('screens.pluginsPanel.trustedKeysCard.pluginsSignedByOneOfThese')}
              </p>
              <TextField
                label={say('screens.pluginsPanel.trustedKeysCard.keyId')}
                value={id}
                onValueChange={setId}
                autoComplete="off"
                {...(idProblem === null ? {} : { error: idProblem })}
              />
              <TextField
                label={say('screens.pluginsPanel.trustedKeysCard.publicKey')}
                value={publicKey}
                onValueChange={setPublicKey}
                autoComplete="off"
                {...(keyProblem === null ? {} : { error: keyProblem })}
              />
            </div>
          </DialogContent>
          <DialogFooter
            dismiss={{ onChoose: closeAdding }}
            confirm={{
              label: say('screens.pluginsPanel.trustedKeysCard.trustKey'),
              isSubmit: true,
              isLoading: isSaving,
            }}
          />
        </Form>
      </Dialog>

      <ConfirmDialog
        title={say('screens.pluginsPanel.trustedKeysCard.stopTrustingId', { id: forgetting ?? '' })}
        detail={say('screens.pluginsPanel.trustedKeysCard.pluginsItSignedStayInstalled')}
        confirmLabel={say('common.forget')}
        isBusy={isSaving}
        isOpen={forgetting !== null}
        onClose={() => {
          setForgetting(null);
        }}
        onConfirm={() => {
          if (forgetting !== null) {
            void save(
              saved
                .filter((each) => each.id !== forgetting)
                .map((each) => ({ id: each.id, publicKey: each.publicKey })),
              say('screens.pluginsPanel.trustedKeysCard.noLongerTrustingId', { id: forgetting }),
            );
          }
        }}
      />
    </PanelCard>
  );
};

TrustedKeysCard.displayName = 'TrustedKeysCard';

export { TrustedKeysCard };
