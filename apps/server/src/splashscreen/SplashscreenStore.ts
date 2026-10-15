import type { PictureLimits } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { Picture, PictureStore } from '@ValenceServer/pictures/PictureStore';

type Splashscreen = Picture;

type SplashscreenStore = PictureStore;

const SPLASHSCREEN_LIMITS: PictureLimits = {
  mostBytes: 16 * 1024 * 1024,
  mostPixelsAnEdge: 8192,
};

export type { Splashscreen, SplashscreenStore };

export { SPLASHSCREEN_LIMITS };
