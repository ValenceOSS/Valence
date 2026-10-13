import { Bin } from '@keyline-icons/react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import {
  createApiKey,
  fetchApiKeys,
  revokeApiKey,
  setApiKeyEnabled,
} from '@ValenceClient/account/fetchApiKeys';
import { describeKeyLastUsed } from '@ValenceClient/account/describeKeyLastUsed';
import type { ApiKey } from '@ValenceContracts/schemas/ApiKey';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const NOT_ALLOWED = 403;

const styles = StyleSheet.create({
  key: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 10 },
  made: { borderRadius: 12, borderWidth: 1, gap: 6, padding: 12 },
  said: { flex: 1, gap: 2 },
  whole: { gap: 12, padding: 16 },
});

/**
 * The API keys on this account, as the web's security panel lists them: what each may do, when it
 * was last used, a switch to turn it off and on and a way to revoke it, and the making of a new one,
 * which is shown once — held down to copy — and never again, since the server keeps only a hash of
 * it. Revoking asks first, since whatever uses the key stops working at once.
 */
const TheApiKeys = () => {
  const colours = useTheColours();
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [isReading, setIsReading] = useState(true);
  const [isNotAllowed, setIsNotAllowed] = useState(false);
  const [name, setName] = useState('');
  const [isMaking, setIsMaking] = useState(false);
  const [made, setMade] = useState<{ name: string; key: string } | null>(null);

  const read = useCallback(async () => {
    try {
      setKeys(await fetchApiKeys());
    } catch (error) {
      setIsNotAllowed(error instanceof RequestFailed && error.status === NOT_ALLOWED);
      setKeys(null);
    }

    setIsReading(false);
  }, []);

  useEffect(() => {
    void read();
  }, [read]);

  const make = () => {
    if (name.trim() === '') {
      return;
    }

    setIsMaking(true);
    void createApiKey({
      name: name.trim(),
      expiresInDays: null,
      permissions: null,
      rateLimit: null,
    })
      .then(async (key) => {
        if (key !== null) {
          setMade({ name: key.name, key: key.key });
          setName('');
        }

        await read();
      })
      .finally(() => {
        setIsMaking(false);
      });
  };

  return (
    <AGroup title={say('screens.accountArea.aPIKeys')}>
      <View style={styles.whole}>
        {isReading ? (
          <ASpinner colour={colours.textMuted} />
        ) : isNotAllowed ? (
          <Words tone="muted">{say('screens.apiKeyPanel.thisAccountIsNotAllowedTo')}</Words>
        ) : keys === null ? (
          <Words tone="danger">{say('screens.apiKeyPanel.yourKeysCouldNotBeRead')}</Words>
        ) : (
          <>
            <Words size="small" tone="muted">
              {say('screens.apiKeyPanel.aKeyLetsSomethingThatIs')}
            </Words>

            {made === null ? null : (
              <View style={[styles.made, { borderColor: colours.highlight }]}>
                <Words size="small" tone="accent">
                  {say('screens.apiKeyPanel.copyNameNowItWillNotBeShownAgain', { name: made.name })}
                </Words>
                <Words isSelectable>{made.key}</Words>
              </View>
            )}

            <TextField
              label={say('screens.apiKeyPanel.whatIsThisKeyFor')}
              placeholder={say('screens.apiKeyPanel.homeAssistant')}
              value={name}
              onValueChange={setName}
              onSubmit={make}
            />

            <Button isBusy={isMaking} isDisabled={name.trim() === ''} onPress={make}>
              {say('screens.apiKeyPanel.createKey')}
            </Button>

            {keys.length === 0 ? (
              <Words size="small" tone="muted">
                {say('screens.apiKeyPanel.noKeysYet')}
              </Words>
            ) : (
              keys.map((key) => (
                <View key={key.id} style={styles.key}>
                  <View style={styles.said}>
                    <Words isStrong>{key.name}</Words>
                    <Words size="small" tone="muted">
                      {[
                        describeKeyLastUsed(key.lastRequestAt),
                        key.permissions === null
                          ? say('screens.apiKeyPanel.noPermissions')
                          : sayCount('common.count.permissions', key.permissions.length),
                      ].join(' · ')}
                    </Words>
                  </View>

                  <Toggle
                    label={
                      key.enabled
                        ? say('common.turnNameOff', { name: key.name })
                        : say('common.turnNameOn', { name: key.name })
                    }
                    isOn={key.enabled}
                    onToggle={() => {
                      void setApiKeyEnabled(key.id, !key.enabled).then(() => read());
                    }}
                  />

                  <Button
                    tone="bare"
                    label={say('screens.apiKeyPanel.revokeName', { name: key.name })}
                    onPress={() => {
                      Alert.alert(
                        say('screens.apiKeyPanel.revokeName', { name: key.name }),
                        undefined,
                        [
                          { text: say('common.cancel'), style: 'cancel' },
                          {
                            text: say('screens.apiKeyPanel.revokeName', { name: key.name }),
                            style: 'destructive',
                            onPress: () => {
                              void revokeApiKey(key.id).then(() => read());
                            },
                          },
                        ],
                      );
                    }}
                  >
                    <Icon of={Bin} size={20} colour={colours.danger} />
                  </Button>
                </View>
              ))
            )}
          </>
        )}
      </View>
    </AGroup>
  );
};

TheApiKeys.displayName = 'TheApiKeys';

export { TheApiKeys };
