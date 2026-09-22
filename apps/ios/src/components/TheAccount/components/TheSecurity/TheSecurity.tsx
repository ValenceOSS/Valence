import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import {
  deletePasskey,
  disableTwoFactor,
  enableTwoFactor,
  listPasskeys,
  renamePasskey,
  verifyTotp,
} from '@ValenceClient/session/auth';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';

const PASSKEYS = ['account', 'passkeys'] as const;

const A_SECRET = /[?&]secret=([^&]+)/u;

const styles = StyleSheet.create({
  act: { padding: 10 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  section: { gap: 12 },
  words: { flex: 1, gap: 2 },
});

/**
 * How this account signs in, as the web's Security panel has it: two-step sign in turned on — added
 * to the phone's Passwords app in one press, with the key to type elsewhere and the backup codes to
 * keep — or off again, each asking for the password first; and the passkeys it has, each to rename or,
 * asked first, remove.
 *
 * A passkey is added from the web, which is where a passkey can be made for a server at an address of
 * its owner's choosing.
 */
const TheSecurity = () => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const who = useQuery(sessionQueries.who());
  const passkeys = useQuery({ queryKey: PASSKEYS, queryFn: listPasskeys });
  const isOn = who.data?.twoFactorEnabled === true;
  const [step, setStep] = useState<'resting' | 'password' | 'enrolling'>('resting');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [enrollment, setEnrollment] = useState<{ totpURI: string; backupCodes: string[] } | null>(
    null,
  );
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const reset = () => {
    setStep('resting');
    setPassword('');
    setCode('');
    setEnrollment(null);
    setRefusal(null);
  };

  const withThePassword = async () => {
    setIsWorking(true);
    setRefusal(null);

    if (isOn) {
      const isOff = await disableTwoFactor(password);

      setIsWorking(false);

      if (!isOff) {
        setRefusal('That password is not right.');

        return;
      }

      reset();
      await cache.invalidateQueries({ queryKey: sessionQueries.key });

      return;
    }

    const enrolled = await enableTwoFactor(password);

    setIsWorking(false);

    if (enrolled === null) {
      setRefusal('That password is not right.');

      return;
    }

    setEnrollment(enrolled);
    setStep('enrolling');
  };

  const finish = async () => {
    setIsWorking(true);
    setRefusal(null);

    const isRight = await verifyTotp(code.trim());

    setIsWorking(false);

    if (!isRight) {
      setRefusal('That code is not right. Try the one your app shows now.');

      return;
    }

    reset();
    await cache.invalidateQueries({ queryKey: sessionQueries.key });
  };

  const secret =
    enrollment === null ? null : decodeURIComponent(A_SECRET.exec(enrollment.totpURI)?.[1] ?? '');

  return (
    <>
      <View style={styles.section}>
        <Words size="heading">Two-step sign in</Words>
        <Words tone="muted">
          {isOn
            ? 'Your account asks for a code from your authenticator app when you sign in.'
            : 'A code from an authenticator app as well as your password, every time you sign in.'}
        </Words>

        {step === 'resting' ? (
          <Button
            tone="quiet"
            onPress={() => {
              setStep('password');
            }}
          >
            {isOn ? 'Turn off' : 'Set up'}
          </Button>
        ) : null}

        {step === 'password' ? (
          <>
            <Words size="small" tone="muted">
              Confirm it is you before changing sign in requirements.
            </Words>
            <TextField
              label="Password"
              value={password}
              onValueChange={setPassword}
              placeholder="Password"
              isSecret
              onSubmit={() => {
                void withThePassword();
              }}
            />
            <Button
              isBusy={isWorking}
              onPress={() => {
                void withThePassword();
              }}
            >
              Continue
            </Button>
            <Button tone="quiet" onPress={reset}>
              Cancel
            </Button>
          </>
        ) : null}

        {step === 'enrolling' && enrollment !== null ? (
          <>
            <Button
              tone="quiet"
              onPress={() => {
                void Linking.openURL(enrollment.totpURI);
              }}
            >
              Add to Passwords
            </Button>

            {secret === null || secret === '' ? null : (
              <>
                <Words size="small" tone="muted">
                  Or enter this key in your authenticator app by hand.
                </Words>
                <Words isSelectable>{secret}</Words>
              </>
            )}

            <Words size="small" tone="muted">
              Save these now. Each works once if you lose your authenticator, and they are not shown
              again.
            </Words>
            <Words isSelectable>{enrollment.backupCodes.join('   ')}</Words>

            <TextField
              label="Authenticator code"
              value={code}
              onValueChange={setCode}
              placeholder="123456"
              keyboard="code"
              onSubmit={() => {
                void finish();
              }}
            />
            <Words size="small" tone="muted">
              Enter a code from your app to finish. Two-factor is not on until you do.
            </Words>
            <Button
              isBusy={isWorking}
              onPress={() => {
                void finish();
              }}
            >
              Turn on two-factor
            </Button>
            <Button tone="quiet" onPress={reset}>
              Cancel
            </Button>
          </>
        ) : null}

        {refusal === null ? null : <Words tone="danger">{refusal}</Words>}
      </View>

      <View style={styles.section}>
        <Words size="heading">Passkeys</Words>

        {passkeys.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

        {(passkeys.data ?? []).length === 0 && !passkeys.isPending ? (
          <Words tone="muted">No passkeys yet. Add one from Valence on the web.</Words>
        ) : null}

        {(passkeys.data ?? []).map((passkey) => {
          const name = passkey.name ?? 'A passkey';

          return (
            <View key={passkey.id} style={styles.row}>
              <View style={styles.words}>
                <Words>{name}</Words>
                {passkey.createdAt === null || passkey.createdAt === undefined ? null : (
                  <Words size="small" tone="muted">
                    {`Added ${saidWhen(passkey.createdAt)}`}
                  </Words>
                )}
              </View>

              <Button
                tone="bare"
                label={`Rename ${name}`}
                onPress={() => {
                  Alert.prompt(
                    'Rename passkey',
                    undefined,
                    (next) => {
                      if (next.trim() !== '') {
                        void renamePasskey(passkey.id, next.trim()).then(async () =>
                          cache.invalidateQueries({ queryKey: PASSKEYS }),
                        );
                      }
                    },
                    'plain-text',
                    name,
                  );
                }}
              >
                <View style={styles.act}>
                  <Icon of={Pencil} size={18} colour={colours.textMuted} />
                </View>
              </Button>

              <Button
                tone="bare"
                label={`Remove ${name}`}
                onPress={() => {
                  Alert.alert(`Remove ${name}?`, 'It will no longer sign you in.', [
                    { text: 'Keep it', style: 'cancel' },
                    {
                      text: 'Remove it',
                      style: 'destructive',
                      onPress: () => {
                        void deletePasskey(passkey.id).then(async () =>
                          cache.invalidateQueries({ queryKey: PASSKEYS }),
                        );
                      },
                    },
                  ]);
                }}
              >
                <View style={styles.act}>
                  <Icon of={Trash2} size={18} colour={colours.textMuted} />
                </View>
              </Button>
            </View>
          );
        })}
      </View>
    </>
  );
};

TheSecurity.displayName = 'TheSecurity';

export { TheSecurity };
