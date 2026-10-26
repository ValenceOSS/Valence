import { useState } from 'react';
import type { WebhookDelivery, WebhookSubscription } from '@ValenceContracts/schemas/Webhook';
import { WebhooksPanel } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/WebhooksPanel';
import { ShowcaseScope } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShowcaseScope/ShowcaseScope';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';
import type { WebhooksPictureProps } from './WebhooksPicture.types';

const DISCORD = '00000000-0000-4000-8000-00000000d15c';

const HOME_ASSISTANT = '00000000-0000-4000-8000-0000000000a5';

const FAILED_DELIVERY = '00000000-0000-4000-8000-0000000000f1';

const ANSWERED_DELIVERY = '00000000-0000-4000-8000-0000000000f2';

const SERVER_ERROR = 'The server answered 500 Internal Server Error';

const SECOND = 1000;

/**
 * The time a moment before now, written as the server writes one.
 *
 * @param now - Now.
 * @param seconds - How long before now.
 * @returns The time.
 */
const before = (now: number, seconds: number): string =>
  new Date(now - seconds * SECOND).toISOString();

/**
 * The webhooks set up on the made-up server, the first failing until it is sent again.
 *
 * @param now - Now.
 * @param isAnswered - Whether the failed delivery has been sent again and answered.
 * @returns The webhooks.
 */
const webhooksAt = (now: number, isAnswered: boolean): WebhookSubscription[] => [
  {
    id: DISCORD,
    name: 'Discord announcements',
    url: 'https://discord.example/api/webhooks/8137/valence',
    preset: 'discord',
    events: ['media.added', 'playback.started'],
    filters: { mediaAdded: 'perScan', accounts: [], profiles: [], itemTypes: [] },
    enabled: true,
    createdAt: before(now, 86_400),
    lastAttemptAt: before(now, isAnswered ? 1 : 30),
    lastStatus: isAnswered ? 200 : 500,
    lastError: isAnswered ? null : SERVER_ERROR,
  },
  {
    id: HOME_ASSISTANT,
    name: 'Home Assistant',
    url: 'http://homeassistant.lan/api/webhook/valence',
    preset: 'generic',
    events: ['playback.started', 'playback.stopped'],
    filters: { mediaAdded: 'perScan', accounts: [], profiles: [], itemTypes: [] },
    enabled: true,
    createdAt: before(now, 86_400),
    lastAttemptAt: before(now, 120),
    lastStatus: 200,
    lastError: null,
  },
];

/**
 * What has been sent to the failing webhook, the latest failing until it is sent again.
 *
 * @param now - Now.
 * @param isAnswered - Whether the failed delivery has been sent again and answered.
 * @returns The deliveries.
 */
const deliveriesAt = (now: number, isAnswered: boolean): WebhookDelivery[] => [
  {
    id: FAILED_DELIVERY,
    subscriptionId: DISCORD,
    event: 'media.added',
    attempts: isAnswered ? 4 : 3,
    firstAttemptAt: before(now, 300),
    lastAttemptAt: before(now, isAnswered ? 1 : 30),
    ok: isAnswered,
    status: isAnswered ? 200 : 500,
    error: isAnswered ? null : SERVER_ERROR,
  },
  {
    id: ANSWERED_DELIVERY,
    subscriptionId: DISCORD,
    event: 'playback.started',
    attempts: 1,
    firstAttemptAt: before(now, 3_600),
    lastAttemptAt: before(now, 3_600),
    ok: true,
    status: 204,
    error: null,
  },
];

/**
 * Answers a change as the server would when it takes it.
 *
 * @returns That nothing was refused.
 */
const takes = (): Promise<null> => Promise.resolve(null);

/**
 * The admin page of webhooks, drawn by the app's own panel with the failing one's history open;
 * acted out, its failed delivery is sent again and this time answered.
 *
 * @param isActed - Whether the failed delivery has been sent again.
 */
const WebhooksPicture = ({ isActed = false }: WebhooksPictureProps) => {
  const [now] = useState(() => Date.now());

  return (
    <ShowcaseScope>
      <div className="w-full text-left">
        <WebhooksPanel
          webhooks={webhooksAt(now, isActed)}
          onReadAgain={nothing}
          created={null}
          onCreate={takes}
          onEdit={takes}
          accounts={[]}
          profiles={[]}
          onDismissCreated={nothing}
          onSetEnabled={nothing}
          onDelete={nothing}
          onTest={nothing}
          deliveries={deliveriesAt(now, isActed)}
          openHistoryId={DISCORD}
          isHistoryLoading={false}
          onOpenHistory={nothing}
          onRedeliver={nothing}
        />
      </div>
    </ShowcaseScope>
  );
};

WebhooksPicture.displayName = 'WebhooksPicture';

export { WebhooksPicture };
