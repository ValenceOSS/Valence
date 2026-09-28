import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { PluginTrust } from '@ValenceContracts/schemas/Plugin';
import type { PluginManifest } from '@ValenceSDK/manifest/PluginManifestSchema';

type PluginSettingValues = Record<string, string | boolean>;

type InstalledRecord = {
  id: string;
  version: string;
  trust: PluginTrust;
  manifest: PluginManifest;
  packageBase64: string;
  sha256: string;
  isEnabled: boolean;
  settings: PluginSettingValues;
  installedBy: string | null;
  installedAt: string;
  updatedAt: string;
  problem: string | null;
};

type ConnectionRecord = {
  pluginId: string;
  profileId: string;
  provider: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  account: string | null;
};

type PluginStore = {
  list: () => Promise<InstalledRecord[]>;
  read: (id: string) => Promise<InstalledRecord | null>;
  save: (record: Omit<InstalledRecord, 'installedAt' | 'updatedAt' | 'problem'>) => Promise<void>;
  change: (
    id: string,
    changes: Partial<Pick<InstalledRecord, 'isEnabled' | 'settings' | 'problem'>>,
  ) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  readValue: (pluginId: string, key: string) => Promise<JsonValue | null>;
  writeValue: (pluginId: string, key: string, value: JsonValue, bytes: number) => Promise<void>;
  forgetValue: (pluginId: string, key: string) => Promise<void>;
  listKeys: (pluginId: string, prefix: string) => Promise<string[]>;
  bytesKept: (pluginId: string, except?: string) => Promise<number>;
  readConnection: (
    pluginId: string,
    profileId: string,
    provider: string,
  ) => Promise<ConnectionRecord | null>;
  saveConnection: (connection: ConnectionRecord) => Promise<void>;
  forgetConnection: (pluginId: string, profileId: string, provider: string) => Promise<boolean>;
  rememberProfile: (pluginId: string, profileId: string) => Promise<void>;
  profilesOf: (pluginId: string) => Promise<string[]>;
};

export type { ConnectionRecord, InstalledRecord, PluginSettingValues, PluginStore };
