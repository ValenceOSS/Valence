import type { PictureFault } from '@ValenceServer/profiles/whatIsWrongWithThePicture';

type Picture = {
  body: Uint8Array;
  contentType: string;
};

type PictureStore = {
  read: () => Promise<Picture | null>;
  address: () => Promise<string | null>;
  save: (picture: Picture) => Promise<PictureFault | null>;
  remove: () => Promise<boolean>;
};

export type { Picture, PictureStore };
