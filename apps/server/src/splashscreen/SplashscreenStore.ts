import { PICTURE_LIMITS } from '@ValenceContracts/constants/PICTURE_LIMITS';
import type { PictureLimits } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { Picture, PictureStore } from '@ValenceServer/pictures/PictureStore';

type Splashscreen = Picture;

type SplashscreenStore = PictureStore;

const SPLASHSCREEN_LIMITS: PictureLimits = PICTURE_LIMITS.splashscreen;

export type { Splashscreen, SplashscreenStore };

export { SPLASHSCREEN_LIMITS };
