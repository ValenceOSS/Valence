import { useState } from 'react';
import type { ApiKey } from '@ValenceContracts/schemas/ApiKey';
import { PanelCard } from '@ValenceUI/PanelCard';
import { ApiKeyList } from '@ValenceScreens/components/ApiKeyPanel/components/ApiKeyList/ApiKeyList';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';
import { say } from '@ValenceI18n/say';
import type { ApiKeysPictureProps } from './ApiKeysPicture.types';

const MINUTE = 60_000;

const DISCORD_BOT = 'Discord bot';

/**
 * The keys a made-up account has, and the one it makes when acted out.
 *
 * @param now - Now.
 * @param hasMade - Whether the new key has been made.
 * @returns The keys.
 */
const keysAt = (now: number, hasMade: boolean): ApiKey[] => [
  ...(hasMade
    ? [
        {
          id: 'discord-bot',
          name: DISCORD_BOT,
          start: 'vk_Hn4r',
          enabled: true,
          expiresAt: null,
          lastRequestAt: null,
          requestCount: 0,
          permissions: null,
          rateLimit: null,
          createdAt: new Date(now).toISOString(),
        },
      ]
    : []),
  {
    id: 'home-assistant',
    name: 'Home Assistant',
    start: 'vk_7Qm2',
    enabled: true,
    expiresAt: null,
    lastRequestAt: new Date(now - 2 * MINUTE).toISOString(),
    requestCount: 412,
    permissions: null,
    rateLimit: { max: 60, everySeconds: 60 },
    createdAt: new Date(now - 90 * 24 * 60 * MINUTE).toISOString(),
  },
  {
    id: 'backups',
    name: 'Backup script',
    start: 'vk_c41e',
    enabled: false,
    expiresAt: null,
    lastRequestAt: new Date(now - 26 * 60 * MINUTE).toISOString(),
    requestCount: 31,
    permissions: ['jobs.run', 'media.rescan', 'library.edit'],
    rateLimit: null,
    createdAt: new Date(now - 30 * 24 * 60 * MINUTE).toISOString(),
  },
];

/**
 * The keys an account has made, drawn by the app's own list; acted out, a new one is made and shown
 * in full, once.
 *
 * @param isActed - Whether the new key has been made.
 * @param isCopied - Whether the new key has been copied.
 */
const ApiKeysPicture = ({ isActed = false, isCopied = false }: ApiKeysPictureProps) => {
  const [now] = useState(() => Date.now());

  return (
    <PanelCard title={say('screens.accountArea.aPIKeys')} isFlush className="w-full text-left">
      <ApiKeyList
        keys={keysAt(now, isActed)}
        made={isActed ? { name: DISCORD_BOT, key: 'vk_Hn4r8TzQ2mWc07bdLxCo' } : null}
        hasCopied={isActed && isCopied}
        name={isActed ? '' : DISCORD_BOT}
        isMaking={false}
        onNameChange={nothing}
        onCreate={nothing}
        onCopy={nothing}
        onToggle={nothing}
        onRevoke={nothing}
      />
    </PanelCard>
  );
};

ApiKeysPicture.displayName = 'ApiKeysPicture';

export { ApiKeysPicture };
