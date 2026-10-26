import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { useCallback, useEffect, useState } from 'react';
import { Spinner } from '@ValenceUI/Spinner';
import {
  fetchApiKeys,
  createApiKey,
  setApiKeyEnabled,
  revokeApiKey,
} from '@ValenceClient/account/fetchApiKeys';
import type { ApiKey } from '@ValenceContracts/schemas/ApiKey';
import { ApiKeyList } from '@ValenceScreens/components/ApiKeyPanel/components/ApiKeyList/ApiKeyList';
import type { ApiKeyPanelProps } from './ApiKeyPanel.types';
import { say } from '@ValenceI18n/say';

const NOT_ALLOWED = 403;
/**
 * The API keys on this account: what each may do, when it was last used, and the making of new ones.
 * A new key is shown once and never again, since the server keeps only a hash of it.
 *
 * @param onChanged - Told when a key was made, disabled or removed.
 */
const ApiKeyPanel = ({ showKeyForMilliseconds }: ApiKeyPanelProps) => {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [isReading, setIsReading] = useState(true);
  const [name, setName] = useState('');
  const [isMaking, setIsMaking] = useState(false);
  const [made, setMade] = useState<{ name: string; key: string } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [couldNotRead, setCouldNotRead] = useState(false);

  const read = useCallback(async () => {
    setCouldNotRead(false);

    try {
      setKeys(await fetchApiKeys());
    } catch (error) {
      if (error instanceof RequestFailed && error.status === NOT_ALLOWED) {
        setKeys(null);
      } else {
        setCouldNotRead(true);
      }
    }

    setIsReading(false);
  }, []);

  useEffect(() => {
    void read();
  }, [read]);

  useEffect(() => {
    if (made === null || showKeyForMilliseconds === undefined) {
      return;
    }

    const timer = setTimeout(() => {
      setMade(null);
    }, showKeyForMilliseconds);

    return () => {
      clearTimeout(timer);
    };
  }, [made, showKeyForMilliseconds]);

  if (isReading) {
    return <Spinner isCentered label={say('screens.apiKeyPanel.readingYourKeys')} size="sm" />;
  }

  if (couldNotRead) {
    return (
      <CouldNotRead
        said={say('screens.apiKeyPanel.yourKeysCouldNotBeRead')}
        onTryAgain={() => {
          setIsReading(true);
          void read();
        }}
      />
    );
  }

  if (keys === null) {
    return (
      <p className="p-4 text-sm text-text-muted">
        {say('screens.apiKeyPanel.thisAccountIsNotAllowedTo')}
      </p>
    );
  }

  return (
    <ApiKeyList
      keys={keys}
      made={made}
      hasCopied={hasCopied}
      name={name}
      isMaking={isMaking}
      onNameChange={setName}
      onCreate={() => {
        if (name.trim() === '' || isMaking) {
          return;
        }

        setIsMaking(true);
        setHasCopied(false);

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
      }}
      onCopy={() => {
        if (made === null) {
          return;
        }

        void navigator.clipboard.writeText(made.key).then(() => {
          setHasCopied(true);
        });
      }}
      onToggle={(key) => {
        void setApiKeyEnabled(key.id, !key.enabled).then(read);
      }}
      onRevoke={(key) => {
        void revokeApiKey(key.id).then(read);
      }}
    />
  );
};

ApiKeyPanel.displayName = 'ApiKeyPanel';

export { ApiKeyPanel };
