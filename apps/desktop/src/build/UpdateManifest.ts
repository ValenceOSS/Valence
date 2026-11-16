import type { UpdatePlatform } from '@ValenceDesktop/build/UpdatePlatform';

type UpdateManifest = {
  version: string;
  notes: string;
  pub_date: string;
  platforms: Partial<Record<UpdatePlatform, { signature: string; url: string }>>;
};

export type { UpdateManifest };
