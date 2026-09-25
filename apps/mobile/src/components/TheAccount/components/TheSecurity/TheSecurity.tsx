import { Bin, PenLine } from '@keyline-icons/react-native';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from 'react-native';
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
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { say } from '@ValenceI18n/say';

const PASSKEYS = ['account', 'passkeys'] as const;

const A_SECRET = /[?&]secret=([^&]+)/u;

const styles = StyleSheet.create({
  act: { padding: 10 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  section: { gap: 10, padding: 16 },
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
        setRefusal(say('phone.theSecurity.wrongPassword'));

        return;
      }

      reset();
      await cache.invalidateQueries({ queryKey: sessionQueries.key });

      return;
    }

    const enrolled = await enableTwoFactor(password);

    setIsWorking(false);

    if (enrolled === null) {
      setRefusal(say('phone.theSecurity.wrongPassword'));

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
      setRefusal(say('phone.theSecurity.wrongCode'));

      return;
    }

    reset();
    await cache.invalidateQueries({ queryKey: sessionQueries.key });
  };

  const secret =
    enrollment === null ? null : decodeURIComponent(A_SECRET.exec(enrollment.totpURI)?.[1] ?? '');

  return (
    <AGroup title={say('phone.theSecurity.heading')}>
      <View style={styles.section}>
        <Words isStrong>{say('phone.theSecurity.twoStep')}</Words>
        <Words tone="muted">
          {isOn ? say('phone.theSecurity.twoStepOn') : say('phone.theSecurity.twoStepOff')}
        </Words>

        {step === 'resting' ? (
          <Button
            tone="quiet"
            onPress={() => {
              setStep('password');
            }}
          >
            {isOn ? say('phone.theSecurity.turnOff') : say('phone.theSecurity.setUp')}
          </Button>
        ) : null}

        {step === 'password' ? (
          <>
            <Words size="small" tone="muted">
              {say('phone.theSecurity.confirmItIsYou')}
            </Words>
            <TextField
              label={say('phone.theSecurity.passwordLabel')}
              value={password}
              onValueChange={setPassword}
              placeholder={say('phone.theSecurity.passwordLabel')}
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
              {say('phone.theSecurity.continue')}
            </Button>
            <Button tone="quiet" onPress={reset}>
              {say('common.cancel')}
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
              {say('phone.theSecurity.addToPasswords')}
            </Button>

            {secret === null || secret === '' ? null : (
              <>
                <Words size="small" tone="muted">
                  {say('phone.theSecurity.enterKeyByHand')}
                </Words>
                <Words isSelectable>{secret}</Words>
              </>
            )}

            <Words size="small" tone="muted">
              {say('phone.theSecurity.saveBackupCodes')}
            </Words>
            <Words isSelectable>{enrollment.backupCodes.join('   ')}</Words>

            <TextField
              label={say('phone.theSecurity.codeLabel')}
              value={code}
              onValueChange={setCode}
              placeholder="123456"
              keyboard="code"
              onSubmit={() => {
                void finish();
              }}
            />
            <Words size="small" tone="muted">
              {say('phone.theSecurity.enterCodeToFinish')}
            </Words>
            <Button
              isBusy={isWorking}
              onPress={() => {
                void finish();
              }}
            >
              {say('phone.theSecurity.turnOn')}
            </Button>
            <Button tone="quiet" onPress={reset}>
              {say('common.cancel')}
            </Button>
          </>
        ) : null}

        {refusal === null ? null : <Words tone="danger">{refusal}</Words>}
      </View>

      <View style={styles.section}>
        <Words isStrong>{say('phone.theSecurity.passkeys')}</Words>

        {passkeys.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

        {(passkeys.data ?? []).length === 0 && !passkeys.isPending ? (
          <Words tone="muted">{say('phone.theSecurity.noPasskeys')}</Words>
        ) : null}

        {(passkeys.data ?? []).map((passkey) => {
          const name = passkey.name ?? say('phone.theSecurity.aPasskey');

          return (
            <View key={passkey.id} style={styles.row}>
              <View style={styles.words}>
                <Words>{name}</Words>
                {passkey.createdAt === null || passkey.createdAt === undefined ? null : (
                  <Words size="small" tone="muted">
                    {say('phone.theSecurity.added', { when: saidWhen(passkey.createdAt) })}
                  </Words>
                )}
              </View>

              <Button
                tone="bare"
                label={say('phone.theSecurity.renameWho', { name })}
                onPress={() => {
                  Alert.prompt(
                    say('phone.theSecurity.renamePasskey'),
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
                  <Icon of={PenLine} size={18} colour={colours.textMuted} />
                </View>
              </Button>

              <Button
                tone="bare"
                label={say('phone.theSecurity.removeWho', { name })}
                onPress={() => {
                  Alert.alert(
                    say('phone.theSecurity.removeTitle', { name }),
                    say('phone.theSecurity.removeBody'),
                    [
                      { text: say('phone.theSecurity.keepIt'), style: 'cancel' },
                      {
                        text: say('phone.theSecurity.removeIt'),
                        style: 'destructive',
                        onPress: () => {
                          void deletePasskey(passkey.id).then(async () =>
                            cache.invalidateQueries({ queryKey: PASSKEYS }),
                          );
                        },
                      },
                    ],
                  );
                }}
              >
                <View style={styles.act}>
                  <Icon of={Bin} size={18} colour={colours.textMuted} />
                </View>
              </Button>
            </View>
          );
        })}
      </View>
    </AGroup>
  );
};

TheSecurity.displayName = 'TheSecurity';

export { TheSecurity };
