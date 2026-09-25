declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native';

  const image: ImageSourcePropType;

  // oxlint-disable-next-line import/no-default-export -- Metro hands an image to whatever imports it as the default export, and this only says so
  export default image;
}
