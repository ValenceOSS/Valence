import type { ComponentType } from 'react';
import { DevicesVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/DevicesVignette/DevicesVignette';
import { HdrVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/HdrVignette/HdrVignette';
import { SkipsVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SkipsVignette/SkipsVignette';
import { ReaderVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ReaderVignette/ReaderVignette';
import { PartyVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/PartyVignette/PartyVignette';
import { ShareLinkVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShareLinkVignette/ShareLinkVignette';
import { OfflineVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/OfflineVignette/OfflineVignette';
import { NotificationsVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/NotificationsVignette/NotificationsVignette';
import { SessionsVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SessionsVignette/SessionsVignette';
import { WebhooksVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/WebhooksVignette/WebhooksVignette';
import { SetupVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SetupVignette/SetupVignette';
import { ContractVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ContractVignette/ContractVignette';
import { ApiKeysVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ApiKeysVignette/ApiKeysVignette';
import { PluginsVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/PluginsVignette/PluginsVignette';
import { TerminalVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/TerminalVignette/TerminalVignette';
import { HouseholdVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/HouseholdVignette/HouseholdVignette';
import { AuthVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/AuthVignette/AuthVignette';
import type { FeatureVisualKind, FeatureVisualProps } from './FeatureVisual.types';

const VIGNETTES: Record<FeatureVisualKind, ComponentType> = {
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

/**
 * A feature shown rather than illustrated: a small, true-to-life piece of the product doing the
 * thing the card describes, drawn in the theme's own colours and fading into the page rather than
 * sitting in a box of its own. Left for the eye rather than the screen reader, since the card's
 * words already say it.
 *
 * @param kind - Which feature's piece of the product to draw.
 */
const FeatureVisual = ({ kind }: FeatureVisualProps) => {
  const Vignette = VIGNETTES[kind];

  return (
    <div
      aria-hidden
      inert
      className="pointer-events-none relative flex h-full select-none items-center-safe justify-center overflow-hidden [--vignette-width:28rem] mask-b-from-80%"
    >
      <span className="flex w-full justify-center">
        <Vignette />
      </span>
    </div>
  );
};

FeatureVisual.displayName = 'FeatureVisual';

export { FeatureVisual };
