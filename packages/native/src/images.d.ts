declare module '*.png' {
  const image: number;

  // oxlint-disable-next-line import/no-default-export -- Metro hands an image to whatever imports it as the default export, as the number it is registered under, and this only says so
  export default image;
}
