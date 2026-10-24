import { useState } from 'react';
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
  const [forgetting, setForgetting] = useState<string | null>(null);
  const [answered, setAnswered] = useState<{
    after: TrustedKeysCardProps['keys'];
    keys: TrustedKeysCardProps['keys'];
  } | null>(null);
  const shown = answered !== null && answered.after === keys ? answered.keys : keys;
  const saved = shown.filter((key) => !key.isFromVariable);

  const save = (next: TrustedKey[], said: string) => {
    setIsSaving(true);

    void saveTrustedKeys(next)
      .then((now) => {
        setAnswered({ after: keys, keys: now });
        tellOutcome(said, null);
        setId('');
        setPublicKey('');
        onSaved();
      })
      .catch((problem: Error) => {
        tellOutcome('', problem.message);
      })
      .finally(() => {
        setIsSaving(false);
        setForgetting(null);
      });
  };

  return (
    <PanelCard title={say('screens.pluginsPanel.trustedKeysCard.trustedSigningKeys')}>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-text-muted">
          {say('screens.pluginsPanel.trustedKeysCard.pluginsSignedByOneOfThese')}
        </p>

        {shown.length === 0 ? null : (
          <ul className="flex flex-col divide-y divide-border/50 rounded-xl border border-border/60">
            {shown.map((key) => (
              <li key={key.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-text">
                  {key.id}
                </span>
                {key.isFromVariable ? (
                  <span className="text-xs text-text-muted">
                    {say('screens.pluginsPanel.trustedKeysCard.setByTheEnvironment')}
                  </span>
                ) : (
                  <Button
                    variant="secondary"
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <TextField
            label={say('screens.pluginsPanel.trustedKeysCard.keyId')}
            value={id}
            onValueChange={setId}
            size="sm"
            autoComplete="off"
            className="sm:w-48"
          />
          <TextField
            label={say('screens.pluginsPanel.trustedKeysCard.publicKey')}
            value={publicKey}
            onValueChange={setPublicKey}
            size="sm"
            autoComplete="off"
            className="min-w-0 flex-1"
          />
          <Button
            variant="glossy"
            size="sm"
            isLoading={isSaving}
            disabled={id.trim() === '' || publicKey.trim() === ''}
            onClick={() => {
              save(
                [
                  ...saved.map((key) => ({ id: key.id, publicKey: key.publicKey })),
                  { id: id.trim(), publicKey: publicKey.trim() },
                ],
                say('screens.pluginsPanel.trustedKeysCard.nowTrustingId', { id: id.trim() }),
              );
            }}
          >
            {say('screens.pluginsPanel.trustedKeysCard.trustKey')}
          </Button>
        </div>
      </div>

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
            save(
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
