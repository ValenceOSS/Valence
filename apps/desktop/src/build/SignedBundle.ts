import type { UpdatePlatform } from '@ValenceDesktop/build/UpdatePlatform';

type SignedBundle = {
  platform: UpdatePlatform;
  file: string;
  signature: string;
};

export type { SignedBundle };
