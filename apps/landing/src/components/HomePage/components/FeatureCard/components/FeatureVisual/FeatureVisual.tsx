import { useRef } from 'react';
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
import { cn } from '@ValenceUI/cn';
import { IsometricStage } from '@ValenceLanding/components/IsometricStage/IsometricStage';
import type { FeatureVisualKind, FeatureVisualProps } from './FeatureVisual.types';
import { useScaleToFit } from './useScaleToFit';

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

const TOUCHABLE: ReadonlySet<FeatureVisualKind> = new Set(['reader']);

/**
 * A feature shown rather than illustrated: a small, true-to-life piece of the product doing the
 * thing the card describes, drawn in the theme's own colours and shrunk to fit its well whole
 * rather than cut off at the edge. Left for the eye rather than the screen reader, since the card's
 * words already say it. Most can't be touched; the few worth playing with, such as the book whose
 * page can be turned by hand, take the pointer.
 *
 * @param kind - Which feature's piece of the product to draw.
 */
const FeatureVisual = ({ kind }: FeatureVisualProps) => {
  const Vignette = VIGNETTES[kind];
  const isTouchable = TOUCHABLE.has(kind);
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scale = useScaleToFit(frameRef, contentRef);

  return (
    <div
      ref={frameRef}
      aria-hidden
      {...(isTouchable ? {} : { inert: true })}
      className={cn(
        'relative flex h-full select-none items-center justify-center overflow-hidden p-5 [--vignette-width:28rem] mask-b-from-85%',
        isTouchable ? '' : 'pointer-events-none',
      )}
    >
      <div ref={contentRef} style={{ scale }} className="flex w-full shrink-0 justify-center">
        <IsometricStage>
          <Vignette />
        </IsometricStage>
      </div>
    </div>
  );
};

FeatureVisual.displayName = 'FeatureVisual';

export { FeatureVisual };
