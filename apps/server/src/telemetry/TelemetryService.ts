import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type { TelemetryPreview } from '@ValenceContracts/schemas/TelemetryPreview';

type TelemetrySent = 'sent' | 'heldOff' | 'failed';

type TelemetryService = {
  isHeldOffByEnvironment: boolean;
  preview: () => Promise<TelemetryPreview>;
  send: () => Promise<TelemetrySent>;
  resetInstallId: () => Promise<string>;
  notePlayback: (kind: ClientKind, player: string) => void;
};

export type { TelemetrySent, TelemetryService };
