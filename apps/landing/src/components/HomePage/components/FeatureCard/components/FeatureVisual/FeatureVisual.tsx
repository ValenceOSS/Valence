import { Suspense, useRef } from 'react';
import { useInView } from 'motion/react';
import { lazyNamed } from '@ValenceLanding/lazyNamed';
import type { Preloadable } from '@ValenceLanding/lazyNamed';
import { cn } from '@ValenceUI/cn';
import { IsometricStage } from '@ValenceLanding/components/IsometricStage/IsometricStage';
import type { FeatureVisualKind, FeatureVisualProps } from './FeatureVisual.types';

const DevicesVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/DevicesVignette/DevicesVignette'),
  'DevicesVignette',
);

const HdrVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/HdrVignette/HdrVignette'),
  'HdrVignette',
);

const SkipsVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SkipsVignette/SkipsVignette'),
  'SkipsVignette',
);

const ReaderVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ReaderVignette/ReaderVignette'),
  'ReaderVignette',
);

const PartyVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/PartyVignette/PartyVignette'),
  'PartyVignette',
);

const ShareLinkVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShareLinkVignette/ShareLinkVignette'),
  'ShareLinkVignette',
);

const OfflineVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/OfflineVignette/OfflineVignette'),
  'OfflineVignette',
);

const NotificationsVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/NotificationsVignette/NotificationsVignette'),
  'NotificationsVignette',
);

const SessionsVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SessionsVignette/SessionsVignette'),
  'SessionsVignette',
);

const WebhooksVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/WebhooksVignette/WebhooksVignette'),
  'WebhooksVignette',
);

const SetupVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SetupVignette/SetupVignette'),
  'SetupVignette',
);

const ContractVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ContractVignette/ContractVignette'),
  'ContractVignette',
);

const ApiKeysVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ApiKeysVignette/ApiKeysVignette'),
  'ApiKeysVignette',
);

const PluginsVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/PluginsVignette/PluginsVignette'),
  'PluginsVignette',
);

const TerminalVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/TerminalVignette/TerminalVignette'),
  'TerminalVignette',
);

const HouseholdVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/HouseholdVignette/HouseholdVignette'),
  'HouseholdVignette',
);

const AuthVignette = lazyNamed(
  () =>
    import('@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/AuthVignette/AuthVignette'),
  'AuthVignette',
);

const VIGNETTES: Record<FeatureVisualKind, Preloadable> = {
  devices: DevicesVignette,
  hdr: HdrVignette,
  skips: SkipsVignette,
  reader: ReaderVignette,
  party: PartyVignette,
  shareLink: ShareLinkVignette,
  offline: OfflineVignette,
  notifications: NotificationsVignette,
  sessions: SessionsVignette,
  webhooks: WebhooksVignette,
  setup: SetupVignette,
  contract: ContractVignette,
  apiKeys: ApiKeysVignette,
  plugins: PluginsVignette,
  terminal: TerminalVignette,
  household: HouseholdVignette,
  auth: AuthVignette,
};

const TOUCHABLE: ReadonlySet<FeatureVisualKind> = new Set(['reader']);

/**
 * A feature shown rather than illustrated: a small, true-to-life piece of the product doing the
 * thing the card describes, drawn in the theme's own colours at the app's own size and cut off at
 * the card's edge rather than shrunk to fit, and loaded only as the card nears the screen. Left for the eye
 * rather than the screen reader, since the card's words already say it. Most can't be touched; the
 * few worth playing with, such as the book whose page can be turned by hand, take the pointer.
 *
 * @param kind - Which feature's piece of the product to draw.
 */
const FeatureVisual = ({ kind }: FeatureVisualProps) => {
  const Vignette = VIGNETTES[kind];
  const isTouchable = TOUCHABLE.has(kind);
  const frameRef = useRef<HTMLDivElement>(null);
  const isNear = useInView(frameRef, { once: true, margin: '400px' });

  return (
    <div
      ref={frameRef}
      aria-hidden
      {...(isTouchable ? {} : { inert: true })}
      className={cn(
        'relative h-full select-none overflow-hidden mask-x-from-90% mask-b-from-85%',
        isTouchable ? '' : 'pointer-events-none',
      )}
    >
      <IsometricStage>
        {isNear ? (
          <Suspense fallback={null}>
            <Vignette />
          </Suspense>
        ) : null}
      </IsometricStage>
    </div>
  );
};

FeatureVisual.displayName = 'FeatureVisual';

export { FeatureVisual };
