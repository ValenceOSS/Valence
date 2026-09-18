import type {
  PictureFault,
  PictureLimits,
} from '@ValenceServer/profiles/whatIsWrongWithThePicture';

type Splashscreen = {
  body: Uint8Array;
  contentType: string;
};

type SplashscreenStore = {
  read: () => Promise<Splashscreen | null>;
  address: () => Promise<string | null>;
  save: (picture: Splashscreen) => Promise<PictureFault | null>;
  remove: () => Promise<boolean>;
};

const SPLASHSCREEN_LIMITS: PictureLimits = {
  mostBytes: 16 * 1024 * 1024,
  mostPixelsAnEdge: 8192,
};

export type { Splashscreen, SplashscreenStore };

export { SPLASHSCREEN_LIMITS };
