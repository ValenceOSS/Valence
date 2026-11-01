import type { DeviceIdentity } from '@ValenceContracts/schemas/DeviceIdentity';

type HeldSession = {
  id: string;
  deviceId: string | null;
  device: DeviceIdentity | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastActiveAt: Date | null;
  expiresAt: Date;
};

type SeenDevice = { deviceId: string | null; identity: DeviceIdentity; at: Date };

type DeviceNotes = {
  heldBy: (userId: string, now: Date) => Promise<HeldSession[]>;
  note: (sessionId: string, seen: SeenDevice) => Promise<void>;
  noteActive: (sessionId: string, at: Date) => Promise<void>;
  renamedBy: (userId: string) => Promise<ReadonlyMap<string, string>>;
  rename: (userId: string, deviceId: string, name: string | null) => Promise<void>;
  end: (userId: string, sessionIds: readonly string[]) => Promise<void>;
};

export type { DeviceNotes, HeldSession, SeenDevice };
